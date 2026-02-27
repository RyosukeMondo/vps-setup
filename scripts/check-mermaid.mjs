#!/usr/bin/env node
/**
 * check-mermaid.mjs
 * Statically validates Mermaid diagram strings extracted from phases.ts.
 *
 * Detects:
 *  - Gantt bars too narrow for their label (→ negative <rect> width in browser)
 *  - Non-ASCII characters in chart types known to break Mermaid 10.x parsers
 *    (quadrantChart, gantt section/task names)
 *
 * Run:  npm run check:mermaid
 */

import { readFileSync } from 'fs';

const PHASES_TS = new URL('../src/data/phases.ts', import.meta.url).pathname;
const src = readFileSync(PHASES_TS, 'utf8');

// Extract all diagram template-literal values
const diagrams = [...src.matchAll(/diagram:\s*`([^`]+)`/gs)].map((m, i) => ({
  index: i + 1,
  content: m[1].trim(),
}));

console.log(`Checking ${diagrams.length} Mermaid diagrams in phases.ts\n`);

let errors = 0;

for (const { index, content } of diagrams) {
  const firstLine = content.split('\n')[0].trim();
  const type = firstLine.split(/\s+/)[0];

  if (type === 'gantt') {
    errors += checkGantt(index, content);
  } else if (type === 'quadrantChart') {
    errors += checkQuadrant(index, content);
  } else {
    console.log(`  ✓  [${index}] ${type}`);
  }
}

console.log(errors === 0
  ? '\n✅  All diagrams passed\n'
  : `\n❌  ${errors} error(s) found — fix before committing\n`
);
process.exit(errors > 0 ? 1 : 0);

// ─── Gantt checker ────────────────────────────────────────────────────────────
// Mermaid gantt places each task's label INSIDE its bar.
// Bar pixel width ≈ (taskMin / totalMin) * GRID_WIDTH.
// If label text width > bar width → negative <rect> attribute in browser.
//
// Conservative model:
//   GRID_WIDTH  = 700px  (mermaid internal grid, minus label column)
//   ASCII char  =   8px
//   Non-ASCII   =  14px  (CJK / fullwidth — mermaid underestimates these)
//   MIN_BAR_PCT =   8%   threshold below which bar is risky
function checkGantt(index, content) {
  const GRID = 700;
  const ASCII_W = 8;
  const WIDE_W = 14;

  const lines = content.split('\n').map(l => l.trim()).filter(Boolean);
  let errs = 0;
  let totalMinutes = 0;
  const tasks = [];

  // First pass: collect tasks and compute sequential totals
  for (const line of lines) {
    const m = line.match(/^(.+?)\s*:[^,]*,\s*[\d:]+,\s*(\d+)([mhdw])/);
    if (m) {
      const label = m[1].trim();
      const mins = toMins(parseInt(m[2]), m[3]);
      tasks.push({ label, mins });
      totalMinutes += mins;
    }
  }

  if (tasks.length === 0) {
    console.log(`  ✓  [${index}] gantt (no tasks found)`);
    return 0;
  }

  let hasError = false;
  for (const { label, mins } of tasks) {
    const barPx = (mins / totalMinutes) * GRID;
    const labelPx = [...label].reduce((w, c) => w + (c.charCodeAt(0) > 127 ? WIDE_W : ASCII_W), 0);
    if (labelPx > barPx) {
      const neg = Math.round(barPx - labelPx);
      console.error(`  ✗  [${index}] gantt: "${label}" — bar ${barPx.toFixed(0)}px < label ${labelPx}px (rect width ~${neg})`);
      errs++;
      hasError = true;
    }
  }

  if (!hasError) {
    const minPct = Math.min(...tasks.map(t => t.mins / totalMinutes * 100)).toFixed(1);
    console.log(`  ✓  [${index}] gantt (${tasks.length} tasks, narrowest bar ${minPct}%)`);
  }
  return errs;
}

// ─── Quadrant checker ─────────────────────────────────────────────────────────
// Mermaid 10.x quadrantChart parser errors on non-ASCII in structural keywords
// (x-axis, y-axis, quadrant-N labels, data point names).
function checkQuadrant(index, content) {
  const lines = content.split('\n').map(l => l.trim()).filter(Boolean);
  let errs = 0;

  for (const line of lines) {
    if (/^(x-axis|y-axis|quadrant-\d)/.test(line) || /^[\w\s]+:\s*\[/.test(line)) {
      if (/[^\x00-\x7F]/.test(line)) {
        console.error(`  ✗  [${index}] quadrantChart: non-ASCII in structural line — "${line.slice(0, 60)}"`);
        errs++;
      }
    }
  }

  if (errs === 0) console.log(`  ✓  [${index}] quadrantChart`);
  return errs;
}

function toMins(n, unit) {
  return unit === 'm' ? n : unit === 'h' ? n * 60 : unit === 'd' ? n * 1440 : n * 10080;
}
