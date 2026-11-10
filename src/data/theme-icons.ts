/**
 * One abstract icon per learning path, as the inner markup of a 24x24 SVG
 * drawn with `stroke="currentColor"`.
 *
 * WHY THIS FILE EXISTS. These six strings were written out twice, once in
 * TrackCard.astro and once in home/CatalogWall.astro, and the tracks page
 * redesign needed them a third time for the path headings. They were
 * verified identical before being moved here, so this is a move, not a
 * redraw. Three copies is how a path ends up with one icon on the homepage
 * and another on /tracks/; one export makes that impossible.
 *
 * Keyed by ThemeKey, so adding a seventh path to src/data/tracks.ts without
 * an icon here is a type error rather than a silently blank tile.
 */
import type { ThemeKey } from './tracks';

export const THEME_ICON_PATHS: Record<ThemeKey, string> = {
	foundations: '<circle cx="8" cy="8" r="5"/><circle cx="16" cy="16" r="5"/>',
	'nn-dl':
		'<circle cx="5" cy="6" r="2"/><circle cx="5" cy="18" r="2"/><circle cx="19" cy="12" r="2"/><path d="M7 6.5 17 11.5M7 17.5 17 12.5"/>',
	transformers:
		'<rect x="3" y="4" width="18" height="3" rx="1"/><rect x="3" y="10.5" width="18" height="3" rx="1"/><rect x="3" y="17" width="18" height="3" rx="1"/>',
	production: '<path d="M12 3a9 9 0 1 1-7 3.3"/><path d="M5 3v4h4"/>',
	specialized: '<path d="M12 3 20 7.5v9L12 21 4 16.5v-9z"/>',
	product: '<rect x="4" y="4" width="16" height="16" rx="4"/><path d="M12 8v8M8 12h8"/>',
};
