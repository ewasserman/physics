---
date: 2026-03-30
subject: Web UI bug triage — user feedback
---

# Web UI Bug Triage

Received user feedback reporting 7 web UI issues. Triaged and sent to developer.

## Issues Filed
1. Scrubber non-functional in live mode (no-op handler)
2. Speed dropdown non-functional in live mode (no-op handler)
3. Tool buttons (Select/Force/Break/Drop) non-functional (InteractionManager never instantiated)
4. Box/Circle dropdown non-functional (same root cause as #3)
5. Debug checkbox appears non-functional (pipeline may not include contacts in snapshots)
6. Play/Stop button state not reset on demo switch (isPlaying closure not updated)
7. Canvas horizontal oscillation (~10-20px jitter from frame counter text width changes)

## Analysis
- Bugs 3-4 are the most significant: the `InteractionManager` is fully implemented in `interaction.ts` but never wired into `app.ts`. This was likely an oversight during Phase 6 (perturbations).
- Bugs 1-2 are live-mode-specific: controls that only work in playback mode are shown but non-functional in live mode.
- Bug 6 is a state sync issue between the UI closure and the app logic.
- Bug 7 is a CSS layout issue — no fixed width on the app container.

## Action
- Memo sent to developer: `doc/developer/inbox/2026-03-30-pm-web-ui-bugs.md`
- Assigned to `developer/web-ui-fixes` branch
- Priority order: 7 > 6 > 3+4 > 2 > 1 > 5
