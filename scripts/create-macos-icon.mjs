import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = path.join(root, 'build', 'icon.png');
const output = path.join(root, 'build', 'icon.icns');
const work = await mkdtemp(path.join(tmpdir(), 'blackline-icon-'));
const representations = [
  { size: 16, type: 'icp4' },
  { size: 32, type: 'icp5' },
  { size: 64, type: 'icp6' },
  { size: 128, type: 'ic07' },
  { size: 256, type: 'ic08' },
  { size: 512, type: 'ic09' },
  { size: 1024, type: 'ic10' },
];

function makeChunk(type, data) {
  const header = Buffer.alloc(8);
  header.write(type, 0, 4, 'ascii');
  header.writeUInt32BE(data.length + header.length, 4);
  return Buffer.concat([header, data]);
}

try {
  const chunks = [];
  for (const representation of representations) {
    const target = path.join(work, `${representation.size}.png`);
    const result = spawnSync('sips', [
      '-z', String(representation.size), String(representation.size), source,
      '--out', target,
    ], { encoding: 'utf8' });
    if (result.status !== 0) {
      throw new Error(`sips failed for ${representation.size}px: ${result.stderr || result.stdout}`);
    }
    chunks.push(makeChunk(representation.type, await readFile(target)));
  }

  const body = Buffer.concat(chunks);
  const header = Buffer.alloc(8);
  header.write('icns', 0, 4, 'ascii');
  header.writeUInt32BE(body.length + header.length, 4);
  await mkdir(path.dirname(output), { recursive: true });
  await writeFile(output, Buffer.concat([header, body]));
  console.log(`Created ${output} with ${representations.length} PNG representations`);
} finally {
  await rm(work, { recursive: true, force: true });
}
