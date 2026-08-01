# Maintaining the Applique shadcn registry

This file is the automation entry point, not a second product guide.

Before changing `packages/shadcn-primitives`, read
[`docs/REGISTRY.md`](../../docs/REGISTRY.md) completely and follow its source
of truth, immutability, sync, testing, and publishing rules.

Do not hand-edit generated registry JSON, generated catalogue metadata, or the
bundled catalogue. Keep primitive APIs separate from any future
Applique-owned facade contract.
