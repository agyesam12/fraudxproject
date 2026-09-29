// Builds the web demo into ../app for GitHub Pages (served at /<repo>/app/).
// Usage: npm run build:pages            (repo "fraudxproject")
//        REPO_NAME=other npm run build:pages
import { spawnSync } from 'node:child_process';
import { rmSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const repo = process.env.REPO_NAME ?? 'fraudxproject';
const outDir = fileURLToPath(new URL('../../app', import.meta.url));

rmSync(outDir, { recursive: true, force: true });
const result = spawnSync(`npx expo export --platform web --output-dir "${outDir}" --clear`, {
  stdio: 'inherit',
  shell: true,
  env: { ...process.env, WEB_BASE_URL: `/${repo}/app` },
});
if (result.status !== 0) process.exit(result.status ?? 1);

// Jekyll would drop the _expo/ folder, so Pages must skip it.
writeFileSync(fileURLToPath(new URL('../../.nojekyll', import.meta.url)), '');
console.log(`\nWeb demo built to app/ for https://<user>.github.io/${repo}/app/`);
