#!/usr/bin/env ts-node
/**
 * Reset the working tree back to a clean main state.
 *
 * Usage:
 *   ts-node scripts/reset-errors.ts                  # discards local changes
 *   ts-node scripts/reset-errors.ts --switch-main    # also checks out main
 */
import { execSync } from 'child_process';

function run(cmd: string): void {
  console.log(`$ ${cmd}`);
  execSync(cmd, { stdio: 'inherit' });
}

function main(): void {
  const args = process.argv.slice(2);
  run('git restore .');
  run('git clean -fd');
  if (args.includes('--switch-main')) {
    run('git checkout main');
  }
  console.log('\n✓ Workspace reset to clean state.');
}

main();
