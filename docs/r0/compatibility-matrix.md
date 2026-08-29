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
  - src/server/routing/**
  - src/app/r0-compat/**
  - tests/e2e/r0-compat.spec.ts
  - tests/fixtures/hmac/**
lastReviewedAt: 2026-08-29
lastReviewedCommit: 82e9edb584c19974746c398027c424ac837e4e37
lastReviewedNote: "Reviewed for Portal #29: exact Production signer/verifier/Redis cutover, fail-closed rollback/redeploy recovery, native routing evidence and retained public-release blockers are current."
related:
  - ../design-plan.md
  - ../../AGENTS.md
  - csp-isr-spike.md
---

# Portal R0 Compatibility Matrix

R0 remains blocked until every required row has evidence bound to one exact Portal `main` commit and EdgeOne Production deployment on `portal.tiangong.earth`. The user-approved single-environment model uses `PORTAL_PUBLIC_INDEXING=disabled` during hosted TDD; local results prove repository behavior only.

| Capability | Local production evidence | EdgeOne main/Production evidence | Gate |
| --- | --- | --- | --- |
| Node 24.18 build + pnpm 11 | `check:toolchain`, frozen install, production build pass | `dppeqhecdjax` built exact `82e9edb`; managed SSR runtime reports `v20.19.3` | Pass |
| Next 16 / React 19 / TypeScript 7 | type-aware lint, `next typegen`, `tsc`, build pass | Exact deployment passed Next 16.3.3 without a Proxy/Middleware artifact | Pass |
| RSC/static shell | `/` and `/r0-compat` prerender | `/` is real 302 to `/zh-CN`; `/r0-compat` is 200 with native routing evidence | Pass |
| SSR runtime | `/r0-compat/ssr` reports local `process.version` | 200, `v20.19.3`, private/no-store on exact deployment | Pass |
| ISR | `/r0-compat/isr` emits `s-maxage=60` and stable cached body | Regenerated from `05:47:10.931Z` to `05:48:21.109Z`, then byte-identical hits with increasing Age | Pass |
| Streaming | dynamic Suspense route passes under report-only CSP | 200/private/no-store; five chunks with completion marker 88 ms after initial chunks | Pass |
| EdgeOne routing | No Next Proxy/middleware artifact; native root/header contract and bounded query-preserving Route Handlers pass locally | Root/native headers and relative 307/no-store Search/Compare/Browse/Process/Flow redirects preserve ordered query values on exact `82e9edb` | Pass |
| Route Handler | dynamic JSON contract, redirects and no-store pass | R0 handler reports exact `82e9edb`, production, `v20.19.3`; LCIA BFF is same-origin, correlation-bound and no-store | Pass |
| Image Optimization | raster brand probe resolves through `/_next/image` locally | EdgeOne emits valid `image/webp` via native `imageMogr2` transformation | Pass |
| locale document / 404 / robots / noindex | zh-CN/en raw HTML and hydrated DOM use exact `lang`; local invalid-locale/global 404 is branded | direct locales/robots and hydrated 404 pass; EdgeOne still wraps raw invalid first-segment HTML in `__next_error__` despite real 404 status; Portal #28 is platform-blocked | **Blocked** |
| Brand defaults/assets/fallback | unit SHA receipt, env parse, production browser fallback pass | Custom color/logo Production smoke pending | Blocked |
| HMAC WebCrypto signer | deterministic `portal-hmac-v1` fixture passes | Main current rotated with previous absent; direct current 404, replay 403, tamper/unknown/expiry 401; EdgeOne `dppeqhecdjax` BFF returns expected 200/unavailable | Pass |
| Redis NX/EX + Lua | Not owned by Portal | Production replay rejection and prior exact `portal:main:v1` TTL/namespace proof pass; guard remains fail closed | Pass |
| Deployment model | Local marker only | User approved one `main`-tracked Production environment for TDD/release; indexing remains disabled until all gates pass | Accepted risk |
| Strict CSP + hydration + ISR | Exact enforce command at `b94451c` passes 13/19; executable inline Flight blocks break hydration-dependent paths | No supported renderer-level solution; see [retained spike](csp-isr-spike.md) | **Blocked** |
| Rollback/cold start/latency | Not a local claim | `dpldjwibrtb4` rollback disables signer with 503; recovery requires current-config redeploy (`dppeqhecdjax`); cold-start/hosted SLA samples remain pending in Portal #13 | Partial |

## CSP blocker

Next App Router emits inline `self.__next_f.push(...)` Flight scripts. Next SRI adds integrity to external assets but does not authorize those inline scripts; a global nonce forces dynamic rendering and disables ISR. The repository therefore keeps the strict candidate in `Content-Security-Policy-Report-Only` while R0 is non-public. R0 cannot exit with `unsafe-inline`, report-only mode, broken hydration, or an ISR test that was made dynamic.

An accepted resolution must preserve the security and cache contract, be proven with `PORTAL_CSP_MODE=enforce` and `PORTAL_EXPECT_STRICT_CSP=1`, and record the exact framework/platform evidence. Until then, hosted TDD may continue on the production domain with indexing disabled, but no public-release completion is allowed.

The retained [strict CSP and ISR spike](csp-isr-spike.md) records the exact reproduction, released Next source boundary, failed candidate matrix, ISR regeneration evidence, and conditions required to reopen this gate.

## Authoritative references

- [Next.js Content Security Policy](https://nextjs.org/docs/app/guides/content-security-policy)
- [Next.js `dynamicParams`](https://nextjs.org/docs/app/api-reference/file-conventions/route-segment-config#dynamicparams)
- [Next.js `NoFallbackError` diagnostic issue](https://github.com/vercel/next.js/issues/87738)
- [Next.js SRI inline Flight limitation](https://github.com/vercel/next.js/issues/95354)
- [Next.js CSP documentation correction](https://github.com/vercel/next.js/pull/96281)
- [EdgeOne `edgeone.json` redirects and headers](https://pages.edgeone.ai/document/edgeone-json)
- [EdgeOne Build Guide](https://pages.edgeone.ai/document/build-guide)
- [EdgeOne Cloud Functions](https://pages.edgeone.ai/document/cloud-functions)
