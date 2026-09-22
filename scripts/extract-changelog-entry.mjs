#!/usr/bin/env node
// =============================================================================
// dbv-md-reader — Extrae la sección de una versión de dbv-specs-ops/CHANGELOG.md
// para usarla como cuerpo de la GitHub Release (releaseBody de tauri-action).
//
// Sin esto, las Releases quedaban con el cuerpo vacío (bug real: v0.16.0 y
// v0.17.0 no llevaban texto explicativo, a diferencia de v0.14.0, cuyo cuerpo
// se había escrito a mano una única vez y no se repitió en versiones
// posteriores) — ningún workflow generaba ni pasaba `releaseBody` a
// tauri-action, que lo deja vacío por defecto si no se le da nada.
//
// Uso: node scripts/extract-changelog-entry.mjs [version]
//   version: "X.Y.Z" (sin la "v"); si se omite, se lee de
//   src-tauri/tauri.conf.json (misma fuente que ya usan los workflows de
//   Release para el tag). Imprime el cuerpo a stdout — sin salto de línea
//   final extra, listo para capturarlo en GITHUB_OUTPUT.
// =============================================================================

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const rootDir = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

function main() {
  const version = process.argv[2] || JSON.parse(
    readFileSync(path.join(rootDir, 'src-tauri', 'tauri.conf.json'), 'utf8')
  ).version;

  const changelog = readFileSync(path.join(rootDir, 'dbv-specs-ops', 'CHANGELOG.md'), 'utf8');
  const lines = changelog.split('\n');
  const headingRe = new RegExp('^## \\[' + version.replace(/\./g, '\\.') + '\\]');

  const startIdx = lines.findIndex((line) => headingRe.test(line));
  if (startIdx === -1) {
    throw new Error('No se encontró la sección de la versión ' + version + ' en CHANGELOG.md');
  }

  var endIdx = lines.length;
  for (var i = startIdx + 1; i < lines.length; i++) {
    if (lines[i] === '---' || lines[i].startsWith('## [')) { endIdx = i; break; }
  }

  const body = lines.slice(startIdx + 1, endIdx).join('\n').trim();
  const footer = 'Detalle completo en el [CHANGELOG](https://github.com/davidbuenov/dbv-md-reader/blob/master/dbv-specs-ops/CHANGELOG.md).';
  process.stdout.write(body + '\n\n' + footer + '\n');
}

main();
