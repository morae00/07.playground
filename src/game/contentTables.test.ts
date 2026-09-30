import assert from 'node:assert/strict';
import { readdirSync } from 'node:fs';
import test from 'node:test';
import CONTENT_TABLES from '../content/data/index.ts';

// Content tables (TEC-05): built apps read src/content/data from assets/content/tables.json (vite.config.ts,
// contentTables), so every table must survive JSON unchanged, and the runtime read must give back the same data.
const dataDir = new URL('../content/data/', import.meta.url);
const runtimeUrl = new URL('../content/tableRuntime.ts', import.meta.url).href;
type Runtime = typeof import('../content/tableRuntime.ts');
const moduleNames = readdirSync(dataDir)
  .filter((file) => file.endsWith('.ts') && file !== 'index.ts' && !file.endsWith('.test.ts'))
  .map((file) => file.slice(0, -'.ts'.length));

function frozenThroughout(value: unknown, path = 'table'): string[] {
  if (typeof value !== 'object' || value === null) return [];
  const problems = Object.isFrozen(value) ? [] : [path];
  return problems.concat(Object.entries(value).flatMap(([key, child]) => frozenThroughout(child, `${path}.${key}`)));
}

test('the index lists every data module under its file name, and each module holds one default export', async () => {
  assert.deepEqual(Object.keys(CONTENT_TABLES).sort(), [...moduleNames].sort());
  for (const name of moduleNames) {
    const module = (await import(new URL(`${name}.ts`, dataDir).href)) as Record<string, unknown>;
    assert.deepEqual(Object.keys(module), ['default'], `${name} exports only its table`);
    assert.equal(module.default, CONTENT_TABLES[name as keyof typeof CONTENT_TABLES]);
  }
});

test('every table survives JSON unchanged and is frozen throughout', () => {
  for (const [name, table] of Object.entries(CONTENT_TABLES)) {
    assert.deepStrictEqual(JSON.parse(JSON.stringify(table)), table, `${name}: no undefined, NaN, Infinity, or functions`);
    assert.deepEqual(frozenThroughout(table, name), [], `${name} is frozen`);
  }
});

test('the runtime read gives back the same tables, frozen, and a failed fetch fails the load', async () => {
  const realFetch = globalThis.fetch;
  const requests: string[] = [];
  try {
    globalThis.fetch = (async (url: string) => {
      requests.push(String(url));
      return new Response(JSON.stringify(CONTENT_TABLES));
    }) as typeof fetch;
    const runtime = (await import(`${runtimeUrl}?ok`)) as Runtime;
    assert.deepEqual(requests, [runtime.CONTENT_TABLES_URL]);
    for (const name of moduleNames) {
      const table = runtime.table(name as keyof typeof CONTENT_TABLES);
      assert.deepStrictEqual(table, CONTENT_TABLES[name as keyof typeof CONTENT_TABLES], name);
      assert.deepEqual(frozenThroughout(table, name), [], `${name} is frozen after the read`);
    }

    globalThis.fetch = (async () => new Response('missing', { status: 404 })) as typeof fetch;
    await assert.rejects(import(`${runtimeUrl}?missing`), /Could not load assets\/content\/tables\.json \(404\)/);
  } finally {
    globalThis.fetch = realFetch;
  }
});
