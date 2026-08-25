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
lastReviewedAt: 2026-08-26
lastReviewedCommit: bootstrap
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

## Repository and delivery model

- Branch model: M1. `main` is the only long-lived branch; routine branches start from and PR back to `main`.
- Tracked work follows the workspace controller and `Project -> Issue -> PR -> Integration`.
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
