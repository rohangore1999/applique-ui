# Applique shadcn registry — agent guide

These files describe the current registry-first implementation in
`packages/shadcn-primitives`.

- [SKILL.md](./SKILL.md): maintenance rules and release workflow
- [CONSUMER_SETUP.md](./CONSUMER_SETUP.md): client installation and updates
- [COMPONENT_COVERAGE.md](./COMPONENT_COVERAGE.md): exact release scope
- [TOKEN_PIPELINE.md](./TOKEN_PIPELINE.md): token and typography delivery

Key facts:

- Clients consume source from immutable `v0.1.0` URLs.
- The baseline is shadcn `4.16.0`, Base UI `base-nova`, React 18.3.1, and
  Tailwind 4.
- The registry covers all 62 official UI entries; 60 contain installable
  source, Form is fileless/deprecated, and Message Scroller is excluded because
  its upstream primitive requires React 19.
- Applique owns the baseline tokens. Clients own installed source and review
  future source merges.
- The npm package build is not the recommended client distribution path.
