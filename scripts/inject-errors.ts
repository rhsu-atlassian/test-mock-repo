#!/usr/bin/env ts-node
/**
 * Inject a planted error scenario into the working tree.
 *
 * Usage:
 *   ts-node scripts/inject-errors.ts <SCENARIO_ID>
 *   ts-node scripts/inject-errors.ts --combine <ID1> <ID2> ...
 *   ts-node scripts/inject-errors.ts --list
 *   ts-node scripts/inject-errors.ts --branch <SCENARIO_ID>      (also creates the branch)
 */
import { execSync } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';

import { SCENARIOS } from './scenarios';
import type { Scenario, Edit } from './scenarios';

const WORKSPACE_ROOT = resolve(__dirname, '..');

function applyEdit(edit: Edit): void {
  const fullPath = resolve(WORKSPACE_ROOT, edit.file);
  const content = readFileSync(fullPath, 'utf8');
  const occurrences = content.split(edit.find).length - 1;
  if (occurrences === 0) {
    throw new Error(`Edit target not found in ${edit.file}:\n  ${edit.find}`);
  }
  if (occurrences > 1) {
    throw new Error(`Edit target matches ${occurrences} times in ${edit.file} — make it more specific`);
  }
  writeFileSync(fullPath, content.replace(edit.find, edit.replace), 'utf8');
  console.log(`  ✓ Patched ${edit.file}`);
}

function injectScenario(scenario: Scenario): void {
  console.log(`\n→ Injecting ${scenario.id}: ${scenario.title}`);
  console.log(`  category: ${scenario.category}  signal: ${scenario.signal}`);
  for (const edit of scenario.edits) {
    applyEdit(edit);
  }
  console.log(`  Expected fix: ${scenario.expectedFix}`);
}

function findScenario(id: string): Scenario {
  const found = SCENARIOS.find((s) => s.id === id);
  if (!found) {
    throw new Error(`No scenario with id: ${id}. Run --list to see all.`);
  }
  return found;
}

function list(): void {
  console.log('Available error scenarios:\n');
  const byCategory = SCENARIOS.reduce<Record<string, Scenario[]>>((acc, s) => {
    (acc[s.category] ??= []).push(s);
    return acc;
  }, {});
  for (const [cat, scenarios] of Object.entries(byCategory)) {
    console.log(`[${cat}]`);
    for (const s of scenarios) {
      console.log(`  ${s.id.padEnd(8)} (${s.signal.padEnd(9)}) ${s.title}`);
    }
    console.log('');
  }
}

function createBranch(scenario: Scenario): void {
  console.log(`Creating branch ${scenario.branch}`);
  execSync(`git checkout -b ${scenario.branch}`, { stdio: 'inherit' });
}

function main(): void {
  const args = process.argv.slice(2);
  if (args.length === 0 || args[0] === '--list') {
    list();
    return;
  }

  if (args[0] === '--combine') {
    const ids = args.slice(1);
    if (ids.length < 2) {
      throw new Error('--combine requires at least 2 scenario IDs');
    }
    console.log(`Combining ${ids.length} scenarios for triage testing.`);
    for (const id of ids) {
      injectScenario(findScenario(id));
    }
    console.log('\n✓ Done. Multiple failures planted — test Copilot triage ability.');
    return;
  }

  if (args[0] === '--branch') {
    const scenario = findScenario(args[1]);
    createBranch(scenario);
    injectScenario(scenario);
    console.log('\n✓ Branch created and error injected. Commit when ready.');
    return;
  }

  const scenario = findScenario(args[0]);
  injectScenario(scenario);
  console.log('\n✓ Done.');
}

main();
