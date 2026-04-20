# shadcn-primitives AI Agent Skill

Agent-facing documentation for `@rohangore1999/shadcn-primitives`. Any AI tool
(Claude, Cursor, Copilot, Cody, etc.) working on this package or consuming it
in another project should read these files.

## Files

- **[SKILL.md](./SKILL.md)** — authoring/maintenance guide: architecture,
  build pipeline, how to add new components, token system, and the
  non-negotiable constraints.
- **[CONSUMER_SETUP.md](./CONSUMER_SETUP.md)** — integration guide for
  downstream apps: install commands, package versions, bundler requirements,
  usage examples, and common pitfalls.
- **[COMPONENT_COVERAGE.md](./COMPONENT_COVERAGE.md)** — full list of all
  49 shadcn/ui components and which file implements each. Single source of
  truth for "what's shipped."
- **[TOKEN_PIPELINE.md](./TOKEN_PIPELINE.md)** — end-to-end walkthrough of
  how a Figma token travels through `Applique.tokens.json` → `tokens.css`
  → `tailwind.config.js` → components → rendered pixel. Read before editing
  tokens or adding new ones.

## Quick entry points

| If you're... | Read first |
|---|---|
| Checking whether a shadcn component exists | COMPONENT_COVERAGE.md |
| Understanding how a Figma token reaches a pixel | TOKEN_PIPELINE.md |
| Adding a new component to the package | SKILL.md §4 |
| Modifying or adding a design token | TOKEN_PIPELINE.md (recipe) |
| Debugging an existing component | SKILL.md §6 |
| Integrating this package into an app | CONSUMER_SETUP.md §1–3 |
| Troubleshooting styles not applying in a consumer | CONSUMER_SETUP.md §5 |

## Key facts at a glance

- **Package:** `@rohangore1999/shadcn-primitives@^0.1.1`
- **Source:** `packages/shadcn-primitives/` in this monorepo
- **Style system:** Tailwind CSS v3, preflight **disabled**
- **Token source:** `packages/shadcn-primitives/docs/Applique.tokens.json`
- **Units:** px only (no rem)
- **Theming:** light mode only (no `.dark` variants)
- **CSS delivery:** auto-imported via side-effect in dist bundles — consumers
  do not need to import stylesheets manually
- **Peer deps:** React 18, React DOM 18
- **Coverage:** all **49 shadcn/ui components** — see [COMPONENT_COVERAGE.md](./COMPONENT_COVERAGE.md)
