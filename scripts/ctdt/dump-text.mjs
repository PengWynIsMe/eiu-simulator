import { spawnSync } from 'node:child_process';
import { mkdir, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '../..');
const pdfDir = path.join(root, 'references/ctdt');
for (const name of await readdir(pdfDir)) {
  if (!name.toLowerCase().endsWith('.pdf')) continue;
  const id = ({ BSE: 'ktpm', CNDC: 'mmt', ACE: 'tdh', BEE: 'dien', MEE: 'cdt', DTVT: 'dtvt', COKHI: 'cokhi', QTKD: 'qtkd' })[path.basename(name, '.pdf')];
  if (!id) continue;
  const target = path.join(pdfDir, 'text', id);
  await mkdir(target, { recursive: true });
  const result = spawnSync('/usr/bin/swift', [path.join(here, 'pdfkit-pages.swift'), path.join(pdfDir, name), target], { encoding: 'utf8' });
  if (result.status !== 0) throw new Error(`PDFKit dump failed for ${name}: ${result.stderr}`);
}
console.log('Wrote PDFKit per-page text to references/ctdt/text/<id>/');
