# Ecobot Hackathon Scorecard

This file maps the current Ecobot build to the hackathon rubric so the team can pitch it deliberately instead of hoping judges infer the work.

## Already Implemented In Product

### Level 1
- Eco-Aesthetic
  Ecobot now uses a mangrove-biome inspired dark palette and atmospheric background.
- Dark Mode Default
  The app boots in dark mode by default.
- Reduce, Reuse, Recycle
  The project uses open-source dependencies and should explicitly credit them in the pitch.

### Level 2
- Nature's Metronome
  The dashboard changes guidance by time-of-day through the mangrove cycle card.
- Sunset Clause
  Tasks now have lifecycle cleanup. Completed items expire after 7 days and stale incomplete items expire after 14 days.
- Low-Bandwidth Mode
  Preferences includes a low-bandwidth mode that reduces AI suggestion traffic and simplifies the dashboard.

### Level 3
- Carbon Footprint Tracker
  Core backend calculations are fully implemented with persisted activity emissions and summaries.
- The Circular Economy
  The product centers on behavior change, lower-impact swaps, reuse choices, and emissions tradeoffs rather than consumption growth.

### Level 4
- Local-First Architecture
  Tasks are stored per-user on-device and dashboard data can fall back to local cache for resilience.
- Degrowth
  The dashboard now includes a "Degrowth Interface" concept where cleaner habits lead to calmer, simpler guidance.

### Level 5
- Total Transparency
  The dashboard now exposes how totals and leaderboard values are calculated instead of hiding scoring logic.

## Implemented In Product And Pitch

### Level 1
- Biomimicry Basics
  Position Ecobot as a mangrove-inspired assistant. Use flora/fauna naming in your pitch:
  Mangrove Cycle, Quiet Canopy, Stable Grove, Restoration Mode.
- The Ripple Effect
  Demo this by logging an activity and showing dashboard totals, category mix, streak context, and suggestions all change immediately.
- The Charitable Cut
  The dashboard now references a 1% premium-revenue allocation to mangrove restoration. Say this clearly in the pitch.

### Level 2
- The Power of One
  The dashboard compares the user against the tracked average. Frame this as "one student vs system-level patterns."
- Asset Recycling
  Reuse the same mangrove motif in background, dashboard cycle, and pitch deck visuals.
- The "Paperless" Pitch
  Build the Sunday deck with only screenshots, charts, and icons. Avoid paragraph slides.

### Level 3
- One Man's Trash
  Frame the market story around replacing wasteful defaults with lower-impact swaps, reuse, and better timing.
- The Butterfly Effect
  In the demo, make the first action a major one:
  Log a high-emission commute or switch low-bandwidth mode.
  Then show how the dashboard path and guidance diverge from there.

### Level 4
- The 100-Year Plan
  Pitch Ecobot as long-horizon infrastructure for habit memory, neighborhood trends, and carbon literacy across generations.
- The Ephemeral UI
  Emphasize that guidance is contextual and time-based instead of a permanent always-on overlay.

## Still Needs Manual Pitch Work

- Explicit open-source credit slide
- Analog fallback concept
  Example: print a habit board with carbon-factor cards and a weekly mangrove tracker.
- True-cost math slide
  Include hosting, inference, and donation assumptions.
- Business model slide
  Show how premium revenue funds habitat restoration.
- 4-squad demo script
  Prepare a tight 3-minute story, 5-minute Q&A answers, and a visual-only deck.

## Not Realistically Compatible As-Is

- Organic Intelligence ("No AI" Run)
  This directly conflicts with Ecobot being an AI assistant.
- The One-Input Constraint
  The app is multi-input by design.
- Show, Don't Tell
  This conflicts with a chat-driven assistant and transparency-heavy dashboard if interpreted literally.

## Best Demo Path

1. Start on the dashboard and point out the mangrove biome, dark default, time-of-day cycle, transparency, and local-first/low-bandwidth status.
2. Log one transport activity and show the ripple:
   totals, chart, category breakdown, suggestions, and standing update.
3. Open AI chat and ask for a practical recommendation.
4. Open Preferences and toggle low-bandwidth mode.
5. Explain sunset cleanup and role-based privacy.
6. End on the admin view as the superuser to show enterprise-level data governance.

## Best Business Framing

- Free tier:
  personal tracking, reminders, local-first cache, and baseline assistant.
- Premium tier:
  richer planning, longer history, and cohort benchmarking.
- Climate commitment:
  1% of premium revenue earmarked for verified mangrove restoration or local habitat work.
