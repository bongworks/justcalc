import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('static E2E configuration', () => {
  it('runs the shared static server tests with one worker on the release runner', () => {
    const workflow = readFileSync(resolve(process.cwd(), '.github/workflows/deploy.yml'), 'utf8');

    expect(workflow).toContain('run: pnpm test:e2e --workers=1');
  });
});
