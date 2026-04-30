/**
 * Per-lesson star counter API.
 *
 *   GET  /api/star/<slug>  -> { slug, count }
 *   POST /api/star/<slug>  -> { slug, count, alreadyStarred }
 *
 * State lives in Cloudflare KV, bound as STARS in the Pages project's
 * Functions -> KV namespace bindings. Keys are `lesson:<slug>`; values
 * are stringified counts.
 *
 * Anti-spam:
 *   - Cookie-based dedup at the server: cookie cw_star_<slug>=1 marks
 *     this browser as already-starred for that lesson; subsequent POSTs
 *     return the current count without incrementing.
 *   - Client-side, the LessonStar component also writes localStorage
 *     so the UI shows "Starred" without needing a roundtrip.
 *
 * Race condition note: KV does not support atomic increments. Two
 * simultaneous POSTs from different browsers can read N and both write
 * N+1 instead of N+2. Acceptable for a low-stakes appreciation signal;
 * occasional under-counts beat an architectural rewrite.
 *
 * Slug validation: only [a-z0-9-]+ allowed. Prevents KV key spam from
 * adversarial slugs.
 */

interface Env {
	STARS: KVNamespace;
}

const SLUG_RE = /^[a-z0-9-]+$/;

function isValidSlug(slug: unknown): slug is string {
	return typeof slug === 'string' && slug.length > 0 && slug.length < 100 && SLUG_RE.test(slug);
}

async function readCount(kv: KVNamespace, slug: string): Promise<number> {
	const v = await kv.get(`lesson:${slug}`);
	return v ? parseInt(v, 10) || 0 : 0;
}

function getCookie(request: Request, name: string): string | null {
	const header = request.headers.get('cookie') || '';
	for (const part of header.split(';')) {
		const [k, ...rest] = part.trim().split('=');
		if (k === name) return decodeURIComponent(rest.join('='));
	}
	return null;
}

const jsonHeaders = { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' };

export const onRequestGet: PagesFunction<Env> = async ({ params, env }) => {
	const slug = params.slug;
	if (!isValidSlug(slug)) {
		return new Response(JSON.stringify({ error: 'invalid slug' }), {
			status: 400,
			headers: jsonHeaders,
		});
	}
	const count = await readCount(env.STARS, slug);
	return new Response(JSON.stringify({ slug, count }), { headers: jsonHeaders });
};

export const onRequestPost: PagesFunction<Env> = async ({ params, env, request }) => {
	const slug = params.slug;
	if (!isValidSlug(slug)) {
		return new Response(JSON.stringify({ error: 'invalid slug' }), {
			status: 400,
			headers: jsonHeaders,
		});
	}

	const cookieKey = `cw_star_${slug}`;
	const already = getCookie(request, cookieKey) === '1';

	if (already) {
		const count = await readCount(env.STARS, slug);
		return new Response(JSON.stringify({ slug, count, alreadyStarred: true }), {
			headers: jsonHeaders,
		});
	}

	const next = (await readCount(env.STARS, slug)) + 1;
	await env.STARS.put(`lesson:${slug}`, String(next));

	const headers = new Headers(jsonHeaders);
	// Long-lived cookie; one star per browser per lesson is the design.
	headers.set('Set-Cookie', `${cookieKey}=1; Path=/; Max-Age=31536000; SameSite=Lax`);

	return new Response(JSON.stringify({ slug, count: next, alreadyStarred: false }), { headers });
};
