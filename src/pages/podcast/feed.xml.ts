/**
 * Podcast RSS feed.
 *
 *   GET /podcast/feed.xml
 *
 * Iterates all published lesson briefs in the docs collection. For each,
 * derives the audio URL by convention (R2 public bucket, lesson slug) and
 * issues a HEAD probe to confirm the audio exists and to fetch its byte
 * length (required by podcast clients in the <enclosure length="...">).
 *
 * Lessons whose audio is not yet uploaded are skipped silently. This lets
 * the feed self-heal as new lessons get audio: nothing has to be touched
 * here when a lesson ships, as long as the audio file lands at the expected
 * R2 path.
 *
 * iTunes namespace fields (itunes:author, itunes:duration, etc.) are added
 * via the customData hook on @astrojs/rss; @astrojs/rss covers the core
 * RSS 2.0 envelope.
 *
 * The probe runs at build time (CF Pages build container is online), so
 * the rendered XML is static. No runtime fetches; the feed is a plain file
 * served from the same bucket as the rest of the site.
 */

import rss, { type RSSFeedItem } from '@astrojs/rss';
import { getCollection } from 'astro:content';
import type { APIRoute } from 'astro';

const SITE_URL = 'https://clawdemy.org';
const AUDIO_BASE = 'https://audio.clawdemy.org/lessons';
const FEED_TITLE = 'Clawdemy Lessons';
const FEED_DESCRIPTION =
	'Free AI literacy for everyday users. Bite-size narrated lessons that turn fear into fluency, one topic at a time.';
const AUTHOR = 'Clawdemy';
const OWNER_EMAIL = 'hello@clawdemy.org';
const FEED_LANGUAGE = 'en';
// Dedicated square podcast cover art (3000x3000 JPG, navy + white Clawdemy
// claw/wordmark) satisfying Apple Podcasts (>=1400x1400, square, RGB, <10MB,
// no text overlays) and Spotify (3000x3000). Replaces the 1200x630 OG image,
// which Apple rejects for being landscape. Added 2026-06-09 to unblock the
// Apple Podcasts submission.
const COVER_ART = `${SITE_URL}/podcast/cover.jpg`;
// Podcasting 2.0 protection tags. Added 2026-06-11 alongside the license
// clarification (LICENSE file restructure + new /legal/licensing/ page).
// - FEED_URL: canonical feed URL for <atom:link rel="self">.
// - FEED_COPYRIGHT: RSS 2.0 <copyright> tag content; All Rights Reserved
//   for audio per LICENSE.
// - PODCAST_GUID: UUID-v5 generated from the lowercased feed URL minus
//   scheme ("clawdemy.org/podcast/feed.xml") using the Podcasting 2.0
//   namespace UUID `ead4c236-bf58-58c6-a2c6-a6b28d128cb6` per the
//   <podcast:guid> spec. Locked: do not change this value even if the
//   feed URL changes (that is the whole point of GUID).
// - PODCAST_LICENSE_URL: deep link to the /legal/licensing#audio section
//   describing the All Rights Reserved posture for audio.
// - PODCAST_LICENSE_CODE: SPDX-style short identifier; "arr" = All Rights
//   Reserved per the Podcasting 2.0 license spec.
// - <podcast:locked> with owner=<itunes:email> tells P2.0-aware indexers
//   to refuse imports unless the requester proves ownership of the email.
//   This is the main protection-against-claim-takeover lever.
const FEED_URL = `${SITE_URL}/podcast/feed.xml`;
const FEED_COPYRIGHT = 'Copyright © 2026 RBJ Global LLC. All rights reserved.';
const PODCAST_GUID = '3f43f058-13af-56c1-a345-a3986aa324d5';
const PODCAST_LICENSE_URL = `${SITE_URL}/legal/licensing/#audio-narration-all-rights-reserved`;
const PODCAST_LICENSE_CODE = 'arr';

interface AudioMeta {
	url: string;
	bytes: number;
}

async function probeAudio(url: string): Promise<AudioMeta | null> {
	// Retry transient failures (network error / 5xx / 429) so a one-off R2 hiccup
	// during the build can't silently drop an episode from the feed. A genuine
	// 404 (no audio yet) returns immediately — it's not retryable.
	for (let attempt = 0; attempt < 3; attempt++) {
		try {
			const r = await fetch(url, { method: 'HEAD' });
			if (r.ok) {
				const len = r.headers.get('content-length');
				if (!len) return null;
				const bytes = parseInt(len, 10);
				if (!Number.isFinite(bytes) || bytes <= 0) return null;
				return { url, bytes };
			}
			if (r.status === 404) return null;
		} catch {
			// network error — fall through to retry
		}
		if (attempt < 2) await new Promise((res) => setTimeout(res, 300 * (attempt + 1)));
	}
	return null;
}

function formatDuration(minutes: number | undefined): string {
	const m = Math.max(1, Math.round(minutes ?? 1));
	const hh = Math.floor(m / 60);
	const mm = m % 60;
	return hh > 0 ? `${hh}:${String(mm).padStart(2, '0')}:00` : `${mm}:00`;
}

function escapeXml(s: string): string {
	return s
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&apos;');
}

export const GET: APIRoute = async (context) => {
	const all = await getCollection('docs');

	const briefs = all.filter((entry) => {
		const data = entry.data as Record<string, unknown>;
		return data.artifact === 'brief' && data.status === 'published';
	});

	const items: RSSFeedItem[] = [];

	for (const brief of briefs) {
		// docs collection IDs look like "lessons/ai-foundations/how-attention-works/brief"
		const parts = brief.id.split('/');
		if (parts.length < 4) continue;
		const slug = parts[parts.length - 2];
		if (!slug) continue;

		const audioUrl = `${AUDIO_BASE}/${slug}-lesson.mp3`;
		const probed = await probeAudio(audioUrl);
		if (!probed) continue;

		const data = brief.data as {
			title?: string;
			description?: string;
			published_at?: Date;
			estimated_read_minutes?: number;
		};

		const lessonPath = parts.slice(0, -1).join('/');
		const lessonUrl = `${SITE_URL}/${lessonPath}/lesson/`;
		const duration = formatDuration(data.estimated_read_minutes);
		const title = data.title ?? slug;
		const description = data.description ?? '';
		const pubDate = data.published_at ?? new Date();

		items.push({
			title,
			description,
			link: lessonUrl,
			pubDate,
			enclosure: {
				url: probed.url,
				length: probed.bytes,
				type: 'audio/mpeg',
			},
			customData: [
				`<itunes:author>${escapeXml(AUTHOR)}</itunes:author>`,
				`<itunes:duration>${duration}</itunes:duration>`,
				`<itunes:explicit>false</itunes:explicit>`,
				`<itunes:summary>${escapeXml(description)}</itunes:summary>`,
			].join(''),
		});
	}

	// Newest first
	items.sort((a, b) => {
		const ad = a.pubDate ? new Date(a.pubDate).getTime() : 0;
		const bd = b.pubDate ? new Date(b.pubDate).getTime() : 0;
		return bd - ad;
	});

	const channelMeta = [
		`<language>${FEED_LANGUAGE}</language>`,
		`<copyright>${escapeXml(FEED_COPYRIGHT)}</copyright>`,
		`<atom:link href="${FEED_URL}" rel="self" type="application/rss+xml" />`,
		`<itunes:author>${escapeXml(AUTHOR)}</itunes:author>`,
		`<itunes:summary>${escapeXml(FEED_DESCRIPTION)}</itunes:summary>`,
		`<itunes:owner><itunes:name>${escapeXml(AUTHOR)}</itunes:name><itunes:email>${escapeXml(OWNER_EMAIL)}</itunes:email></itunes:owner>`,
		`<itunes:image href="${COVER_ART}" />`,
		`<itunes:category text="Education"><itunes:category text="Self-Improvement" /></itunes:category>`,
		`<itunes:category text="Technology" />`,
		`<itunes:explicit>false</itunes:explicit>`,
		`<itunes:type>episodic</itunes:type>`,
		`<podcast:guid>${PODCAST_GUID}</podcast:guid>`,
		`<podcast:locked owner="${escapeXml(OWNER_EMAIL)}">yes</podcast:locked>`,
		`<podcast:license url="${PODCAST_LICENSE_URL}">${PODCAST_LICENSE_CODE}</podcast:license>`,
		`<podcast:medium>podcast</podcast:medium>`,
	].join('');

	return rss({
		xmlns: {
			itunes: 'http://www.itunes.com/dtds/podcast-1.0.dtd',
			podcast: 'https://podcastindex.org/namespace/1.0',
			atom: 'http://www.w3.org/2005/Atom',
		},
		title: FEED_TITLE,
		description: FEED_DESCRIPTION,
		site: context.site ?? SITE_URL,
		items,
		customData: channelMeta,
	});
};
