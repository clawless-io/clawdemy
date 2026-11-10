/**
 * Bring the current page into view in the left sidebar.
 *
 * Founder, 2026-11-10: arriving on a track from the homepage catalog left the
 * sidebar scrolled to the top, so a reader on Track 20 had to scroll down to
 * find where they were. Starlight restores the sidebar's previous scroll
 * position but never moves it to the current page.
 *
 * This runs after that restore (module scripts run once the document is
 * parsed) and only acts when the current link is OUT of view. So moving
 * between neighbouring lessons from the sidebar itself still keeps the
 * reader's own scroll position; only a jump from somewhere else moves it.
 *
 * Desktop only. Below 50em the sidebar is a closed menu, and Starlight
 * skips its own restore there for the same reason.
 */
function revealCurrent() {
	if (!matchMedia('(min-width: 50em)').matches) return;
	const pane = document.getElementById('starlight__sidebar');
	const current = pane?.querySelector<HTMLElement>('a[aria-current="page"]');
	if (!pane || !current) return;
	const p = pane.getBoundingClientRect();
	const c = current.getBoundingClientRect();
	if (c.top >= p.top && c.bottom <= p.bottom) return;
	pane.scrollTop += c.top - p.top - pane.clientHeight / 3;
}

revealCurrent();
