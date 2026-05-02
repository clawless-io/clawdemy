/**
 * Pulls in Starlight's internal virtual-module type declarations so user-land
 * component overrides (e.g. src/components/Footer.astro re-importing
 * virtual:starlight/components/{EditLink,LastUpdated,Pagination}) typecheck
 * cleanly. Starlight ships this d.ts but does not export it from its package
 * `types` entry, so an explicit reference is needed.
 */
/// <reference types="@astrojs/starlight/virtual" />
/// <reference path="../node_modules/@astrojs/starlight/virtual-internal.d.ts" />
