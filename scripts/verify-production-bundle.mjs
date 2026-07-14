import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { auditProductionBundle } from './lib/production-integrity.mjs';

const distRoot = path.resolve(process.env.PRODUCTION_DIST ?? 'dist');
const reportPath = path.resolve(process.env.PRODUCTION_AUDIT_REPORT ?? 'artifacts/release-evidence/production-bundle-audit.json');
const report = await auditProductionBundle(distRoot);
await mkdir(path.dirname(reportPath), { recursive: true });
await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');

if (!report.passed) {
  const details = report.findings.map((finding) => `${finding.file}: ${JSON.stringify(finding.marker)}`).join('\n');
  throw new Error(`Production bundle contains debug or cheat markers:\n${details}`);
}
console.log(`Production integrity passed: ${report.files.length} files, ${report.markersChecked} forbidden markers checked`);
