import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { foldRuleReads } from '../scripts/lib/fold-rules.mjs';
import { CLASSIC_RULES, REMASTER_RULES } from '../src/game/rules.ts';

const rules = { id: 'remaster', version: 2, hitStopBudget: true, logicalSpawnFrame: false };

test('TEC-05: reads of rule flags become literals; writes, calls, unknown names, and the id stay', () => {
  const { code, count } = foldRuleReads([
    'if (this.rules.hitStopBudget && !this.rules.logicalSpawnFrame) x = this.rules.version;',
    'const { hitStopBudget, logicalSpawnFrame } = this.rules;',
    'const { hitStopBudget: renamed } = this.rules;',
    'this.rules.hitStopBudget = false; this.rules.unknownFlag; this.rules.id; this.rules = other; return this.rules;',
  ].join('\n'), rules);
  assert.equal(code, [
    'if ((true) && !(false)) x = (2);',
    'const hitStopBudget = (true), logicalSpawnFrame = (false);',
    'const { hitStopBudget: renamed } = this.rules;',
    'this.rules.hitStopBudget = false; this.rules.unknownFlag; this.rules.id; this.rules = other; return this.rules;',
  ].join('\n'));
  assert.equal(count, 5);
});

test('TEC-05: app builds fold every rule flag GameEngine reads, so only setRuleSet and its getter touch the rule set', () => {
  const source = readFileSync(new URL('../src/game/GameEngine.ts', import.meta.url), 'utf8');
  const { code, count } = foldRuleReads(source, REMASTER_RULES);
  assert.ok(count >= 80, `${count} reads folded`);
  assert.deepEqual(code.match(/this\.rules\b.*$/gm), ['this.rules = ruleSetFor(id);', 'this.rules;'], 'nothing else reads the rule set');
  // Both rule sets have the same flags, so a flag added to one cannot be folded as missing from the other.
  assert.deepEqual(Object.keys(REMASTER_RULES).sort(), Object.keys(CLASSIC_RULES).sort());
});
