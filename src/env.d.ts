/**
 * Pulls in Starlight's internal virtual-module type declarations so user-land
 * component overrides (e.g. src/components/Footer.astro re-importing
 * virtual:starlight/components/{EditLink,LastUpdated,Pagination}) typecheck
 * cleanly. Starlight ships this d.ts but does not export it from its package
 * `types` entry, so an explicit reference is needed.
 */
/// <reference types="@astrojs/starlight/virtual" />
/// <reference path="../node_modules/@astrojs/starlight/virtual-internal.d.ts" />

// text-readability ships pure JS; only the few methods we actually call need
// types. JS port of Python textstat — same method names.
declare module 'text-readability' {
	const rs: {
		fleschReadingEase(text: string): number;
		fleschKincaidGrade(text: string): number;
		smogIndex(text: string): number;
		automatedReadabilityIndex(text: string): number;
		colemanLiauIndex(text: string): number;
		gunningFog(text: string): number;
	};
	export default rs;
}

/**
 * Global installed by src/components/overrides/ThemeProvider.astro.
 *
 * That component's inline script assigns `window.StarlightThemeProvider`
 * before first paint, and ThemeSelect.astro's module script then calls it.
 * Stock Starlight does the same thing, but its copy lives in node_modules and
 * is never typechecked, so the missing declaration only surfaced once we
 * overrode the pair into src/. It failed the "Build, typecheck, validate
 * content" CI job on PR #110.
 *
 * Declared, not imported: the provider must stay an inline script so the theme
 * is set before paint, which means there is no module to import it from.
 */
declare const StarlightThemeProvider: {
	updatePickers(theme?: 'auto' | 'dark' | 'light'): void;
};
