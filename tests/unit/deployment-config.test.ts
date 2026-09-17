import { readFileSync } from 'node:fs';
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
  });

  it('atomically switches the static release and restores the previous release after a failed health check', () => {
    const deployScript = read('deploy/deploy-on-runner.sh');

    expect(deployScript).toContain('SERVICE_PORT:-34560');
    expect(deployScript).toContain('SERVICE_HOST:-0.0.0.0');
    expect(deployScript).toContain('mv -f "$next_link" "$current_link"');
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
