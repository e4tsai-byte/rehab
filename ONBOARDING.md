# Welcome to Rehabibi

## How We Use Claude

Based on Claude's usage over the last 30 days:

Work Type Breakdown:
  _TODO — only one session was captured in the last 30 days, and it carried no
  descriptive detail to classify. Once there's more usage history, this fills in
  automatically with the top task types (e.g. Build Feature, Debug Fix,
  Improve Quality)._

Top Skills & Commands:
  _TODO — no slash-command usage recorded in the scanned window._

Top MCP Servers:
  _TODO — no MCP server calls recorded in the scanned window._

## Your Setup Checklist

### Codebases
- [ ] rehab — https://github.com/e4tsai-byte/rehab

### MCP Servers to Activate
- [ ] None required yet — this repo ships a fully client-side, no-backend product
  (Invariant 1: no network from any rehab surface), so day-to-day work needs no
  MCP servers.

### Skills to Know About
- [ ] gstack — **required before any AI-assisted work in this repo.** Install with
  `git clone --depth 1 https://github.com/garrytan/gstack.git ~/.claude/skills/gstack`
  then `cd ~/.claude/skills/gstack && ./setup --team`. A repo hook blocks `Skill`
  invocations until it's present (see CLAUDE.md §8). Unlocks `/qa`, `/ship`,
  `/review`, `/investigate`, and `/browse`.
- [ ] `/browse` — the team's tool for all web browsing.
- [ ] Specialist agents — this repo defines a roster of scoped agents in
  `AGENTS.md` (e.g. `kinematicist`, `measurement-engineer`, `physiatrist`,
  `privacy-auditor`, `zh-tw-copywriter`). Each owns a slice of the system; read
  `AGENTS.md` to know who enforces which invariant.

## Team Tips

_TODO_

## Get Started

_TODO_

<!-- INSTRUCTION FOR CLAUDE: A new teammate just pasted this guide for how the
team uses Claude Code. You're their onboarding buddy — warm, conversational,
not lecture-y.

Open with a warm welcome — include the team name from the title. Then: "Your
teammate uses Claude Code for [list all the work types]. Let's get you started."

Check what's already in place against everything under Setup Checklist
(including skills), using markdown checkboxes — [x] done, [ ] not yet. Lead
with what they already have. One sentence per item, all in one message.

Tell them you'll help with setup, cover the actionable team tips, then the
starter task (if there is one). Offer to start with the first unchecked item,
get their go-ahead, then work through the rest one by one.

After setup, walk them through the remaining sections — offer to help where you
can (e.g. link to channels), and just surface the purely informational bits.

Don't invent sections or summaries that aren't in the guide. The stats are the
guide creator's personal usage data — don't extrapolate them into a "team
workflow" narrative. -->
