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
lastReviewedCommit: d0836a6cbd5d2a0cbf2f8ad1352caf380591848e
lastReviewedNote: "Reviewed for Portal #33: four-locale public delivery, the user-approved performance-first enforcing CSP, explicit raw-404 upstream disposition, completed brand cycle, public-indexing authorization and exact hosted revalidation requirements replace the old hard-block narrative."
related:
  - ../design-plan.md
  - ../../AGENTS.md
  - csp-isr-spike.md
---

# Portal R0 Compatibility Matrix

R0 exit now requires one exact Portal #33 `main` commit and EdgeOne Production deployment on `portal.tiangong.earth` to pass every non-excepted row below. The user has authorized public indexing and explicitly accepted two platform dispositions: the cacheable enforcing performance CSP profile, and a real 404/noindex/unchanged-URL EdgeOne generic raw document for unknown first segments while the upstream defect remains tracked. Local results prove repository behavior only; the indexing mutation follows the exact hosted preflight.

| Capability | Local production evidence | EdgeOne main/Production evidence | Gate |
| --- | --- | --- | --- |
| Node 24.18 build + pnpm 11 | `check:toolchain`, frozen install, production build pass | `dppeqhecdjax` built exact `82e9edb`; managed SSR runtime reports `v20.19.3` | Pass |
| Next 16 / React 19 / TypeScript 7 | type-aware lint, `next typegen`, `tsc`, build pass | Exact deployment passed Next 16.3.3 without a Proxy/Middleware artifact | Pass |
| RSC/static shell | `/` and `/r0-compat` prerender | `/` is real 302 to `/zh-CN`; `/r0-compat` is 200 with native routing evidence | Pass |
| SSR runtime | `/r0-compat/ssr` reports local `process.version` | 200, `v20.19.3`, private/no-store on exact deployment | Pass |
| ISR | `/r0-compat/isr` emits `s-maxage=60` and stable cached body | Regenerated from `05:47:10.931Z` to `05:48:21.109Z`, then byte-identical hits with increasing Age | Pass |
| Streaming | Dynamic Suspense route passes under the enforcing performance CSP | 200/private/no-store; five chunks with completion marker 88 ms after initial chunks | Pass |
| EdgeOne routing | No Next Proxy/middleware artifact; native root/header contract and bounded query-preserving Route Handlers pass locally | Root/native headers and relative 307/no-store Search/Compare/Browse/Process/Flow redirects preserve ordered query values on exact `82e9edb` | Pass |
| Route Handler | dynamic JSON contract, redirects and no-store pass | R0 handler reports exact `82e9edb`, production, `v20.19.3`; LCIA BFF is same-origin, correlation-bound and no-store | Pass |
| Image Optimization | raster brand probe resolves through `/_next/image` locally | EdgeOne emits valid `image/webp` via native `imageMogr2` transformation | Pass |
| locale document / 404 / robots / noindex | zh-CN/en/de/fr raw HTML and hydrated DOM use exact `lang`; local invalid-locale/global 404 is branded | Existing zh/en routes/robots/hydrated 404 pass; Portal #33 exact four-locale deployment is pending. EdgeOne raw unknown-first-segment remains a real 404/noindex with a generic `__next_error__` document; Portal #28 tracks upstream repair | Pending hosted four-locale proof; raw defect accepted |
| Brand defaults/assets/fallback | unit SHA receipt, env parse, production browser fallback pass | Custom `dpx9m06806fi` and exact default rollback `dpzbmb1u15np` passed color/logo/favicon/metadata/no-JS/axe/CLS/visual gates | Pass |
| HMAC WebCrypto signer | deterministic `portal-hmac-v1` fixture passes | Main current rotated with previous absent; direct current 404, replay 403, tamper/unknown/expiry 401; EdgeOne `dppeqhecdjax` BFF returns expected 200/unavailable | Pass |
| Redis NX/EX + Lua | Not owned by Portal | Production replay rejection and prior exact `portal:main:v1` TTL/namespace proof pass; guard remains fail closed | Pass |
| Deployment model | Local marker only | User approved one `main`-tracked Production environment for TDD/release; indexing remains disabled until all gates pass | Accepted risk |
| Enforcing CSP + hydration + ISR | Portal #33 performance profile passes all 50 production Playwright tests with enforcing CSP, Next inline script/style allowed, `unsafe-eval` forbidden, and ISR still static | Exact Portal #33 EdgeOne receipt must repeat hydration/Streaming/ISR/security-header gates | Pending hosted proof |
| Strict no-inline CSP research | Exact enforce command at `b94451c` passes 13/19; executable inline Flight blocks break hydration-dependent paths | No supported renderer-level solution; see [retained spike](csp-isr-spike.md) | Non-blocking upstream follow-up |
| Rollback/cold start/latency | Local controlled CWV remains inside budgets | `dpldjwibrtb4` rollback disables signer with 503; recovery requires current-config redeploy (`dppeqhecdjax`). Hosted controlled home/detail/Search budgets pass; seven-day RUM begins after publication | Pending Portal #33 receipt; RUM is non-blocking |

## CSP disposition

Next App Router emits inline `self.__next_f.push(...)` Flight scripts. Next SRI adds integrity to external assets but does not authorize those inline scripts; a global nonce forces dynamic rendering and disables ISR. The user selected performance and SEO over the no-inline research requirement. Public Production therefore uses an enforcing CSP that permits Next-required inline scripts/styles, forbids `unsafe-eval`, and retains strict object/base/form/frame/source restrictions. Report-only is not release proof; the exact public deployment must return the enforcing header and pass hydration, Streaming and real ISR together.

The retained strict profile is still proven with `PORTAL_CSP_MODE=enforce` and `PORTAL_EXPECT_STRICT_CSP=1`; its known hydration failures remain useful upstream evidence but no longer block the public performance profile. Public hosted proof uses `PORTAL_CSP_MODE=enforce`, `PORTAL_CSP_PROFILE=performance`, and `PORTAL_EXPECT_STRICT_CSP=0`.

The retained [strict CSP and ISR spike](csp-isr-spike.md) records the exact reproduction, released Next source boundary, failed candidate matrix, ISR regeneration evidence, and conditions required to revisit the stronger future profile.

## Raw 404 disposition

Portal #33 retested a `dynamicParams=true` application candidate. It branded nested unknown-locale paths locally but could not fix a single unknown first segment such as `/es`; fixing that remaining case requires a root-layout/route-tree migration that would sacrifice locale-correct initial HTML or the reviewed ISR boundary. The candidate was withdrawn. Public release requires true HTTP 404, `noindex`, unchanged URL/query, no 5xx, and no soft redirect; the raw EdgeOne document may remain generic until Portal #28 receives an upstream-compatible fix.

## Authoritative references

- [Next.js Content Security Policy](https://nextjs.org/docs/app/guides/content-security-policy)
- [Next.js `dynamicParams`](https://nextjs.org/docs/app/api-reference/file-conventions/route-segment-config#dynamicparams)
- [Next.js `NoFallbackError` diagnostic issue](https://github.com/vercel/next.js/issues/87738)
- [Next.js SRI inline Flight limitation](https://github.com/vercel/next.js/issues/95354)
- [Next.js CSP documentation correction](https://github.com/vercel/next.js/pull/96281)
- [EdgeOne `edgeone.json` redirects and headers](https://pages.edgeone.ai/document/edgeone-json)
- [EdgeOne Build Guide](https://pages.edgeone.ai/document/build-guide)
- [EdgeOne Cloud Functions](https://pages.edgeone.ai/document/cloud-functions)
