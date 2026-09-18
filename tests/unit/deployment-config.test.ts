import { execFileSync } from 'node:child_process';
import { chmodSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');

describe('M2 release deployment configuration', () => {
  it('deploys only release tags or a manual dispatch on the ARM macOS runner', () => {
    const workflow = read('.github/workflows/deploy.yml');

    expect(workflow).toMatch(/tags:\s*\n\s*- 'release-\*'/);
    expect(workflow).toMatch(/workflow_dispatch:/);
    expect(workflow).toMatch(/runs-on: \[self-hosted, bongbong-MacBookPro-M2\]/);
    expect(workflow).toMatch(/NEXT_PUBLIC_GA_MEASUREMENT_ID: \$\{\{ vars\.NEXT_PUBLIC_GA_MEASUREMENT_ID \}\}/);
    expect(workflow).toMatch(/NEXT_PUBLIC_ADSENSE_CLIENT_ID: \$\{\{ vars\.NEXT_PUBLIC_ADSENSE_CLIENT_ID \}\}/);
  });

  it('replaces the current symlink itself when switching a static release', () => {
    const deployScript = read('deploy/deploy-on-runner.sh');
    const functionStart = deployScript.indexOf('switch_to_release() {');
    const functionEnd = deployScript.indexOf('\n}\n\nhealth_check()', functionStart) + 2;
    const switchFunction = deployScript.slice(functionStart, functionEnd);
    const deployRoot = mkdtempSync(resolve(tmpdir(), 'justcalc-deploy-'));
    const oldRelease = resolve(deployRoot, 'releases', 'old');
    const newRelease = resolve(deployRoot, 'releases', 'new');
    const currentLink = resolve(deployRoot, 'current');
    const nextLink = resolve(deployRoot, '.current-next-test');
    const binDirectory = resolve(deployRoot, 'bin');

    try {
      execFileSync('mkdir', ['-p', oldRelease, newRelease]);
      symlinkSync(oldRelease, currentLink);
      execFileSync('mkdir', ['-p', binDirectory]);
      writeFileSync(resolve(binDirectory, 'mv'), `#!/usr/bin/env bash
set -euo pipefail
while [[ "$1" == -* ]]; do shift; done
source="$1"
destination="$2"
if [[ -L "$destination" && -d "$(readlink "$destination")" ]]; then
  /bin/mv "$source" "$(readlink "$destination")/$(basename "$source")"
else
  /bin/mv "$source" "$destination"
fi
`);
      chmodSync(resolve(binDirectory, 'mv'), 0o755);

      execFileSync('bash', ['-ceu', `
        next_link="$1"
        current_link="$2"
        python_bin="$(command -v python3)"
        PATH="$4:$PATH"
        ${switchFunction}
        switch_to_release "$3"
        [[ "$(readlink "$current_link")" == "$3" ]] || exit 1
        [[ ! -e "$1" ]]
      `, 'switch-test', nextLink, currentLink, newRelease, binDirectory]);
    } finally {
      rmSync(deployRoot, { recursive: true, force: true });
    }
  });

  it('restores the previous release after a failed health check', () => {
    const deployScript = read('deploy/deploy-on-runner.sh');

    expect(deployScript).toContain('SERVICE_PORT:-34560');
    expect(deployScript).toContain('SERVICE_HOST:-0.0.0.0');
    expect(deployScript).toContain('curl --fail --retry 5 --retry-connrefused');
    expect(deployScript).toContain('restore_previous_release');
  });

  it('keeps the launchd job alive and starts it when the runner user logs in', () => {
    const plist = read('deploy/com.bongworks.justcalc.plist.template');

    expect(plist).toContain('<key>KeepAlive</key>');
    expect(plist).toContain('<key>RunAtLoad</key>');
    expect(plist).toContain('__SERVICE_PORT__');
    expect(plist).toContain('__SERVICE_HOST__');
  });
});
