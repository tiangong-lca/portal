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
  - when reviewing local or EdgeOne main/Production compatibility evidence
whenToUpdate:
  - when a compatibility probe, platform result, deployment SHA, or blocker changes
checkPaths:
  - docs/r0/compatibility-matrix.md
  - edgeone.json
  - next.config.ts
  - src/app/[locale]/layout.tsx
  - src/app/r0-compat/**
  - tests/e2e/r0-compat.spec.ts
  - tests/fixtures/hmac/**
lastReviewedAt: 2026-08-29
lastReviewedCommit: 16cbb293c9db159fc765ca82baee085cdaede2f7
lastReviewedNote: "Reviewed for Portal #24: exact Proxy failure/rollback evidence, native routing candidate, immutable build SHA and the retained strict CSP/ISR release gate are current."
related:
  - ../design-plan.md
  - ../../AGENTS.md
  - csp-isr-spike.md
---

# Portal R0 Compatibility Matrix

R0 remains blocked until every required row has evidence bound to one exact Portal `main` commit and EdgeOne Production deployment on `portal.tiangong.earth`. The user-approved single-environment model uses `PORTAL_PUBLIC_INDEXING=disabled` during hosted TDD; local results prove repository behavior only.

| Capability | Local production evidence | EdgeOne main/Production evidence | Gate |
| --- | --- | --- | --- |
| Node 24.18 build + pnpm 11 | `check:toolchain`, frozen install, production build pass | `dp6z4vd02d2n` built exact `f039918`; SSR page reports `v20.19.3` | Partial |
| Next 16 / React 19 / TypeScript 7 | type-aware lint, `next typegen`, `tsc`, build pass | Exact deployment build passed Next 16.3.3 and generated 35 function routes | Partial |
| RSC/static shell | `/` and `/r0-compat` prerender | `/r0-compat` is 200; `/` is a cached 200 Next redirect-error document instead of 307 | Blocked |
| SSR runtime | `/r0-compat/ssr` reports local `process.version` | 200, `v20.19.3`, private/no-store on exact deployment | Pass |
| ISR | `/r0-compat/isr` emits `s-maxage=60` and stable cached body | Consecutive bodies are byte-identical with `s-maxage=60`; regeneration probe remains pending | Partial |
| Streaming | dynamic Suspense route passes under report-only CSP | 200/private/no-store; exact chunk-boundary probe pending | Partial |
| EdgeOne routing | No Next Proxy/middleware artifact; bounded native redirects/headers and application locale/404 fallback pass locally | named-only Proxy failed on `cdef8a0`; legacy middleware skipped semantics on `f039918`; named/default Proxy failed on `ffb730a`; native candidate awaits exact deployment | Blocked |
| Route Handler | dynamic JSON contract and no-store pass | 200/no-store, but `f039918` reported stale `cdef8a0`; immutable build-SHA candidate awaits exact deployment | Blocked |
| Image Optimization | raster brand probe resolves through `/_next/image` | Pending | Blocked |
| locale document / 404 / robots / noindex | zh-CN/en raw HTML and hydrated DOM use exact `lang`; invalid locale and global 404 return product UI with `404` and valid language without Proxy | direct zh-CN/en and robots pass on rollback deployment; native root redirect and application fallback await exact deployment | Partial |
| Brand defaults/assets/fallback | unit SHA receipt, env parse, production browser fallback pass | Custom color/logo Production smoke pending | Blocked |
| HMAC WebCrypto signer | deterministic `portal-hmac-v1` fixture passes | Edge verifier/rotation/replay pending in Edge #319 | Blocked |
| Redis NX/EX + Lua | Not owned by Portal | Disposable Upstash + Edge verifier pending | Blocked |
| Deployment model | Local marker only | User approved one `main`-tracked Production environment for TDD/release; indexing remains disabled until all gates pass | Accepted risk |
| Strict CSP + hydration + ISR | Exact enforce command at `b94451c` passes 13/19; executable inline Flight blocks break hydration-dependent paths | No supported renderer-level solution; see [retained spike](csp-isr-spike.md) | **Blocked** |
| Rollback/cold start/latency | Not a local claim | Pending | Blocked |

## CSP blocker

Next App Router emits inline `self.__next_f.push(...)` Flight scripts. Next SRI adds integrity to external assets but does not authorize those inline scripts; a global nonce forces dynamic rendering and disables ISR. The repository therefore keeps the strict candidate in `Content-Security-Policy-Report-Only` while R0 is non-public. R0 cannot exit with `unsafe-inline`, report-only mode, broken hydration, or an ISR test that was made dynamic.

An accepted resolution must preserve the security and cache contract, be proven with `PORTAL_CSP_MODE=enforce` and `PORTAL_EXPECT_STRICT_CSP=1`, and record the exact framework/platform evidence. Until then, hosted TDD may continue on the production domain with indexing disabled, but no public-release completion is allowed.

The retained [strict CSP and ISR spike](csp-isr-spike.md) records the exact reproduction, released Next source boundary, failed candidate matrix, ISR regeneration evidence, and conditions required to reopen this gate.

## Authoritative references

- [Next.js Content Security Policy](https://nextjs.org/docs/app/guides/content-security-policy)
- [Next.js SRI inline Flight limitation](https://github.com/vercel/next.js/issues/95354)
- [Next.js CSP documentation correction](https://github.com/vercel/next.js/pull/96281)
- [EdgeOne Build Guide](https://pages.edgeone.ai/document/build-guide)
- [EdgeOne Cloud Functions](https://pages.edgeone.ai/document/cloud-functions)
