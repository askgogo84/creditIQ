import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

// THEME SINGLE-WRITER GATE
// ------------------------------------------------------------------------
// The site theme keys `creditiq-theme` and `ciq-theme` must be WRITTEN in
// exactly ONE place: lib/store.ts (applyTheme). Every signed-in surface
// toggle (Header, AppRail, TabBar) routes through useTheme().setTheme so it
// physically cannot desync the two keys.
//
// This test fails if ANY other file calls localStorage.setItem for either
// key. That desync — three hand-rolled toggles each deciding for themselves,
// one of them forgetting to mirror ciq-theme — is the exact root cause of the
// light-mode / gold-surface bug this collapse fixed. The gate is what stops a
// fourth copy ever reappearing. See docs/wallet/02-TRD §4.1.
//
// Reads (getItem) are unrestricted — many surfaces legitimately read the keys.
// Only WRITES are gated.

const ROOT = process.cwd();
const ALLOWED = join('lib', 'store.ts');
const SKIP_DIRS = new Set(['node_modules', '.next', '.git', 'scratchpad', 'coverage']);
const WRITE_RE = /\.setItem\(\s*['"`](creditiq-theme|ciq-theme)['"`]/;

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) {
      if (!SKIP_DIRS.has(name)) walk(full, out);
    } else if (/\.(ts|tsx)$/.test(name) && !/\.test\.(ts|tsx)$/.test(name)) {
      out.push(full);
    }
  }
  return out;
}

describe('theme single-writer gate', () => {
  it('only lib/store.ts writes the creditiq-theme / ciq-theme keys', () => {
    const offenders: string[] = [];
    for (const file of walk(ROOT)) {
      const rel = relative(ROOT, file);
      if (rel === ALLOWED) continue;
      readFileSync(file, 'utf8').split('\n').forEach((line, i) => {
        if (WRITE_RE.test(line)) offenders.push(`${rel}:${i + 1}  ${line.trim()}`);
      });
    }
    expect(
      offenders,
      `theme keys may only be written in ${ALLOWED}; found ${offenders.length} other writer(s):\n${offenders.join('\n')}`,
    ).toEqual([]);
  });
});
