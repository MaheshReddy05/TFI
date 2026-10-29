#!/usr/bin/env node
/**
 * Builds the browser demo for GitHub Pages.
 *
 * Runs `expo export --platform web`, then applies the two fixes a static host
 * needs:
 *
 *   404.html   The app is exported as a single-page app, so a direct visit to
 *              a deep link like /TFI/play/whats-common has no file of its own.
 *              GitHub Pages serves 404.html for unknown paths, and a copy of
 *              index.html there hands the route to the client-side router.
 *
 *   .nojekyll  Pages runs Jekyll by default, which ignores files and folders
 *              whose names begin with an underscore. Expo puts the whole JS
 *              bundle under `_expo/`, so without this the page loads blank.
 */
import { execFileSync } from 'node:child_process';
import { copyFileSync, existsSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const OUT = 'dist';

execFileSync('npx', ['expo', 'export', '--platform', 'web', '--output-dir', OUT], {
  stdio: 'inherit',
});

const index = join(OUT, 'index.html');
if (!existsSync(index)) {
  console.error(`build-web: ${index} is missing — the export did not produce a site.`);
  process.exit(1);
}

copyFileSync(index, join(OUT, '404.html'));
writeFileSync(join(OUT, '.nojekyll'), '');
console.log('build-web: added 404.html fallback and .nojekyll');
