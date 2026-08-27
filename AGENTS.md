---
title: tiangong-lca-portal Repository Contract
docType: contract
scope: repo
status: active
authoritative: true
owner: tiangong-lca-portal
language: en
whenToUse:
  - when changing Portal product behavior, server-side data access, branding, deployment, tests, or repository governance
  - when routing work from lca-workspace into tiangong-lca-portal
whenToUpdate:
  - when repository ownership, hard product boundaries, branch policy, validation commands, or deployment rules change
checkPaths:
  - AGENTS.md
  - README.md
  - docs/design-plan.md
  - .docpact/config.yaml
  - package.json
  - src/**
  - public/**
  - tests/**
  - scripts/**
  - .github/workflows/**
  - edgeone.json
lastReviewedAt: 2026-08-27
lastReviewedCommit: 6036dce64ff05b76a4f0d0dbbef0e0d2fc3b8d8f
related:
  - README.md
  - docs/design-plan.md
  - .docpact/config.yaml
---

# tiangong-lca-portal Repository Contract

`tiangong-lca-portal` owns the anonymous public LCA discovery product: its Next.js App Router UI, same-origin server boundary, public DTO adapters, branding, SEO, accessibility, tests, and EdgeOne deployment configuration.

## Hard boundaries

- End users are anonymous. Do not add registration, login, account, user JWT, or session persistence.
- Portal never holds a Supabase secret key, `service_role`, existing global `SERVICE_API_KEY`, or an ordinary Supabase user credential.
- The browser never calls Supabase directly. Database and Edge access stays in `src/server/**` with `server-only` boundaries.
- EdgeOne server code signs only the dedicated Portal Supabase Edge Function requests with the versioned HMAC contract in `docs/design-plan.md`.
- Database schema, RPC, RLS, ACL, and indexes belong to `database-engine`; Edge runtime and HMAC verification belong to `tiangong-lca-edge-functions`.
- Portal is read-only for LCA data. It must not create, edit, review, publish, withdraw, repair, or recalculate datasets.
- Default light/dark primary colors are `#5C246A` and `#9E3FFD`. Other colors use semantic shadcn/ui and Tailwind CSS tokens.
- Node `24.18.x` is the pinned build toolchain, not proof of the deployed SSR runtime. Until an EdgeOne Preview route reports `process.version`, server code stays within Node 20-compatible Web APIs and native `fetch`/Web Crypto.

## Repository and delivery model

- Canonical repository: `tiangong-lca/portal`. The repository has a writable `main` and is registered under the workspace `portal` delivery adapter, Docpact catalog, M1 branch policy, and exact-gitlink integration flow.
- Branch model: M1. `main` is the only long-lived branch; routine branches start from and PR back to `main`.
- Tracked work follows the workspace controller and `Project -> Issue -> PR -> Integration`.
- Repository/workspace onboarding proves only that Portal changes can be reviewed and integrated. It does not prove R0, R1, EdgeOne Preview, or Production readiness.
- Commits are small, coherent, validated checkpoints. Do not mix Database, Edge, or root integration changes into Portal commits.
- A merged Portal PR is repository-complete only; workspace delivery may still require exact root gitlink integration.

## Documentation routing

Before changing files, run the workspace wrapper with this repository as the explicit root:

```bash
/Users/davidli/projects/workspace/scripts/docpact route \
  --root /Users/davidli/projects/workspace/tiangong-lca-portal \
  --paths <paths> \
  --format json
```

`docs/design-plan.md` owns product and technical target state. `AGENTS.md` owns repository boundaries and stable execution facts. `.docpact/config.yaml` owns deterministic documentation routing and coverage.

## Validation contract

Use the scripts declared by the checked-in `package.json`. At minimum, every reviewable change must pass formatting, lint, typecheck, targeted tests, and build when those surfaces exist. UI changes additionally require browser and accessibility verification; server/security changes require contract and negative-path tests.

R0 local tests run the strict CSP candidate in report-only mode so framework hydration remains observable. They are not release evidence. Only `docs/r0/compatibility-matrix.md` may declare R0 status, and it must remain blocked until an exact EdgeOne Preview passes enforcing CSP, runtime, cache, HMAC/Redis, brand, and rollback probes.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
