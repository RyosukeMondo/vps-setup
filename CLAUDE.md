# VPS Setup — Claude Project Instructions

## Mermaid Diagram Validation (MANDATORY)

After **any** edit to `src/data/phases.ts` that touches a `diagram:` field:

```
npm run check:mermaid
```

**Never commit diagram changes without a passing check.** The script exits non-zero on failure.

### What the checker catches

| Error | Cause | Fix |
|-------|-------|-----|
| Gantt negative `<rect>` width | Label text wider than bar (CJK chars ~14px, ASCII ~8px) | Shorten label or use ASCII-only |
| quadrantChart parse error | Non-ASCII in `x-axis` / `y-axis` / `quadrant-N` / data labels | Use English only in those fields |

### Gantt label rules

- Short ASCII labels only for narrow bars (< 15% of total duration)
- Never use Japanese/CJK in gantt task or section names
- `after id` relative dates do **not** work with `dateFormat HH:mm` — use absolute times

### Prefer xychart-beta over gantt

`gantt` charts are unreliable in Mermaid 10.x (black box, negative rect widths, date parser issues).
Use `xychart-beta` bar charts instead for time/comparison data — no date format, no label-overflow.

### Forbidden characters in flowchart node labels

| Character | U+ | Symptom | Fix |
|-----------|-----|---------|-----|
| `—` em dash | 2014 | Parser aborts after first node → single rectangle | Use `-` (U+002D) |

Always use **hyphen-minus** (`-`) not em dash (`—`) in flowchart node labels.

### Other known Mermaid 10.x limits

- Cannot connect an external node to a **subgraph ID** as edge target (`H --> SUBGRAPH_ID` fails)
  → Connect to the **first node inside** the subgraph instead (`H --> firstInternalNode`)
- `style SUBGRAPH_ID` on a subgraph cluster causes **silent blank render** — never style clusters
  → Use `style nodeId` only on individual node IDs
- `quadrantChart` and `gantt` parsers reject non-ASCII in structural positions
- `flowchart` and `sequenceDiagram` support Japanese fine

## Dev Commands

| Command | Purpose |
|---------|---------|
| `npm run dev` | Dev server at `localhost:4321/vps-setup/` |
| `npm run build` | Static build to `dist/` |
| `npm run check:mermaid` | Validate all diagrams in `phases.ts` |
