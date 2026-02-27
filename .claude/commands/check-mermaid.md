Run `npm run check:mermaid` to validate all Mermaid diagrams in `src/data/phases.ts`.

Report the full output to the user. If any errors are found:
1. Show which diagram(s) failed and why
2. Apply the appropriate fix:
   - **Gantt negative rect**: shorten the label to ASCII-only, ≤ ~8 chars for bars < 15% of total duration
   - **quadrantChart parse error**: replace non-ASCII text in x-axis/y-axis/quadrant-N/data labels with English
   - **Subgraph edge target**: connect to the first node inside the subgraph, not the subgraph ID
3. Re-run `npm run check:mermaid` to confirm all diagrams pass
4. Run `npm run build` to confirm the build still succeeds
