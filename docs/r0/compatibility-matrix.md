---
title: Portal R0 Compatibility Matrix
docType: validation
scope: repo
status: active
authoritative: true
owner: tiangong-lca-portal
language: en
whenToUse:
  - when deciding whether R0 bootstrap can exit
  - when reviewing local or EdgeOne Preview compatibility evidence
whenToUpdate:
  - when a compatibility probe, platform result, deployment SHA, or blocker changes
checkPaths:
  - docs/r0/compatibility-matrix.md
  - edgeone.json
  - next.config.ts
  - src/proxy.ts
  - src/app/r0-compat/**
  - tests/e2e/r0-compat.spec.ts
  - tests/fixtures/hmac/**
lastReviewedAt: 2026-08-28
lastReviewedCommit: 7d68ca4
related:
  - ../design-plan.md
  - ../../AGENTS.md
  - csp-isr-spike.md
---

# Portal R0 Compatibility Matrix

R0 remains blocked until every required Preview row has evidence bound to one exact Portal commit and EdgeOne deployment. Local results prove repository behavior only.

| Capability | Local production evidence | EdgeOne Preview evidence | Gate |
| --- | --- | --- | --- |
| Node 24.18 build + pnpm 11 | `check:toolchain`, frozen install, production build pass | Pending canonical push/deployment | Blocked |
| Next 16 / React 19 / TypeScript 7 | type-aware lint, `next typegen`, `tsc`, build pass | Pending | Blocked |
| RSC/static shell | `/` and `/r0-compat` prerender | Pending | Blocked |
| SSR runtime | `/r0-compat/ssr` reports local `process.version` | Must record deployed `process.version` | Blocked |
| ISR | `/r0-compat/isr` emits `s-maxage=60` and stable cached body | Pending cache/refresh probe | Blocked |
| Streaming | dynamic Suspense route passes under report-only CSP | Pending chunk-timing probe | Blocked |
| Proxy | `src/proxy.ts` adds the expected R0 response header and preserves canonical root-level sitemap rewrites | Pending | Blocked |
| Route Handler | dynamic JSON contract and no-store pass | Pending | Blocked |
| Image Optimization | raster brand probe resolves through `/_next/image` | Pending | Blocked |
| 404 / robots / noindex | local status and headers pass | Pending | Blocked |
| Brand defaults/assets/fallback | unit SHA receipt, env parse, production browser fallback pass | Custom color/logo Preview smoke pending | Blocked |
| HMAC WebCrypto signer | deterministic `portal-hmac-v1` fixture passes | Edge verifier/rotation/replay pending in Edge #307 | Blocked |
| Redis NX/EX + Lua | Not owned by Portal | Disposable Upstash + Edge verifier pending | Blocked |
| Preview/Production isolation | Local marker only | Separate environment/credential rejection pending | Blocked |
| Strict CSP + hydration + ISR | Exact enforce command at `b94451c` passes 13/19; executable inline Flight blocks break hydration-dependent paths | No supported renderer-level solution; see [retained spike](csp-isr-spike.md) | **Blocked** |
| Rollback/cold start/latency | Not a local claim | Pending | Blocked |

## CSP blocker

Next App Router emits inline `self.__next_f.push(...)` Flight scripts. Next SRI adds integrity to external assets but does not authorize those inline scripts; a global nonce forces dynamic rendering and disables ISR. The repository therefore keeps the strict candidate in `Content-Security-Policy-Report-Only` while R0 is non-public. R0 cannot exit with `unsafe-inline`, report-only mode, broken hydration, or an ISR test that was made dynamic.

An accepted resolution must preserve the security and cache contract, be proven with `PORTAL_CSP_MODE=enforce` and `PORTAL_EXPECT_STRICT_CSP=1`, and record the exact framework/platform evidence. Until then, other implementation may continue but no public deployment is allowed.

The retained [strict CSP and ISR spike](csp-isr-spike.md) records the exact reproduction, released Next source boundary, failed candidate matrix, ISR regeneration evidence, and conditions required to reopen this gate.

## Authoritative references

- [Next.js Content Security Policy](https://nextjs.org/docs/app/guides/content-security-policy)
- [Next.js SRI inline Flight limitation](https://github.com/vercel/next.js/issues/95354)
- [Next.js CSP documentation correction](https://github.com/vercel/next.js/pull/96281)
- [EdgeOne Build Guide](https://pages.edgeone.ai/document/build-guide)
- [EdgeOne Cloud Functions](https://pages.edgeone.ai/document/cloud-functions)
