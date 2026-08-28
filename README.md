---
title: tiangong-lca-portal
docType: guide
scope: repo
status: active
authoritative: false
owner: tiangong-lca-portal
language: zh-CN
whenToUse:
  - when entering the Portal repository
  - when checking the concise product boundary and primary implementation plan
whenToUpdate:
  - when repository purpose, non-goals, implementation status, or primary documentation changes
checkPaths:
  - README.md
  - AGENTS.md
  - docs/design-plan.md
  - package.json
lastReviewedAt: 2026-08-28
lastReviewedCommit: c4667b1
lastReviewedNote: "Reviewed for Portal #10: local R1 contracts, catalog evidence, validation boundaries, and separately deferred hosted qualification are current."
related:
  - AGENTS.md
  - docs/design-plan.md
---

# tiangong-lca-portal

天工 LCA 公共数据门户 —— 面向**匿名用户**的全球 LCA 数据发现、理解与比较入口。

## 定位

一个只读的公共检索层：

- **匿名优先**：零注册即可使用全部公共查询与展示能力，用户状态保存在 URL 与浏览器本地。
- **元数据无墙**：公共读取契约内 `state_code=100/200` 数据的允许元数据（存在性、适用性、来源、版本、许可、引用方式）匿名可见；数值能力由明确的公开 publication/许可契约决定。
- **可比性优先于排序**：不输出笼统相关度排名，而是给出匹配理由、代理关系与可比性判定。

## 技术形态

Next.js App Router 前后端同构，React Server Components 优先，部署到 EdgeOne Makers。终端用户没有登录态；EdgeOne 后端以 Portal 专用 HMAC 请求签名调用专用 Supabase Edge Functions（如 `portal_hybrid_search_v1`）。数据库读取使用 server-only 的公共只读契约，不使用 service-role；MVP 分享只使用 URL fragment 与 JSON，不写 Redis。默认浅色/深色主色与 `tiangong-lca-next` 一致，其余颜色遵循 shadcn/ui + Tailwind v4 最佳实践，并支持部署级主色、Logo 与 favicon 替换。

## 非目标（与其他项目的边界）

| 不做                                | 归属                                          |
| ----------------------------------- | --------------------------------------------- |
| 数据导入 / 转换 / 规范化生产        | tiangong-lca-cli · tiangong-lca-data-foundry  |
| 过程规范化合并的政策与人工复核队列  | 上游管线，portal 仅透明呈现聚合结果           |
| 登录体系、购买交易闭环              | 不在本项目范围                                |
| 开发者 API / GraphQL / MCP / Skills | 登录后的 tiangong-lca-next 及既有机器调用项目 |
| 桌面应用 / 文档站                   | tiangong-lca-release · tiangong-lca-next-docs |

## 文档

- [产品与技术方案](docs/design-plan.md) —— 产品、UI、权限、数据契约、SEO、EdgeOne、测试、跨仓交付与仓库 onboarding 的主方案。
- [R0 compatibility matrix](docs/r0/compatibility-matrix.md) 与 [strict CSP/ISR evidence](docs/r0/csp-isr-spike.md) —— 当前发布门及可复现的平台兼容性证据。

## 状态

Canonical `tiangong-lca/portal` 已有可写的 `main`，并已作为 `portal` 纳入 workspace 的 M1 分支策略、delivery adapter、Docpact 路由与精确 root gitlink integration 流程。Root gitlink 不自动跟随 child `main`；每个需要 workspace integration 的 release 仍须单独 pin 经审阅的 exact Portal SHA。仓库接入完成不代表 R0、R1、EdgeOne Preview 或 Production 已就绪。

当前实现已建立 R1 Public Catalog 的本地主要闭环：`zh-CN`/`en` 首页与 Browse、lexical/identifier Search、Process/Flow 精确版本详情与 Versions、Exchanges、publication-bound LCIA、确定性比较、引用、本地候选集、SEO/JSON-LD、OKLCH 50–950 品牌色阶与对比度语义、移动 Logo mark、axe/no-JS/forced-colors/三断点自动门、本地 CWV/cache/security probes、依赖漏洞与许可证门、隔离上游 fixture 以及本地 production-build Playwright。Portal 按 exact Database commit 保存 13 份 JSON Schema 与 13 份 generated `.d.ts` 的 byte-identical snapshot，并以 manifest/上游 Git 对比阻止 drift；Search 卡严格消费完整 public context，首页使用 5 分钟 ISR 显示权威 Process/Flow 计数、最近公开变更与可执行 UUID/CAS/分类示例。Catalog sitemap 使用固定 64-way Database manifest、根级双语 reciprocal XML shard 与严格 5 MiB 输出门；默认 `no-store`，只有真实 CDN 证明 300 秒内同步失效且不返回 stale 后才启用共享缓存。Portal PR、最终 exact-SHA root integration 与本地真实浏览器验收完成后，才可称为本地 R1 交付完成。

发布、promotion、托管平台和部署证据不属于当前本地里程碑。Portal #8/#13、Database #543 与 Release #60 保留这些 hosted-only 工作；本地交付不把它们当成阻塞，也不声称它们已经通过。真实 R0 Preview、严格 CSP/ISR 组合、部署后品牌回滚、真实 publication 200/cache-hit、托管 CWV/SLA 与 CDN 缓存语义仍须在未来发布资格审查中完成；在此之前 R0 保持 blocked，不能声称公共或 Production readiness。初始 test/Dev/Production 按批准决策共享一套 Upstash endpoint/token，但使用独立 R0/Dev/Main namespace 与完全不同的 HMAC；namespace 不是安全边界，共享配额、故障域和轮换域风险必须进入未来发布证据。详见 [R0 compatibility matrix](docs/r0/compatibility-matrix.md)、[Redis/HMAC contract](docs/design-plan.md#103-hmac-signed-hybrid-search) 与 [R1 release checklist](docs/design-plan.md#235-r1-public-catalog-mvp-release-checklist)。
