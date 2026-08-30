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
lastReviewedAt: 2026-08-30
lastReviewedCommit: 9bcb45d8480716f60c8548ddbcd6e83833bb5a55
lastReviewedNote: "Reviewed for Portal #35: the four-language public release is live under enforcing CSP and public indexing; the remaining launch gate is the Portal-owned default Search facet/result payload correction discovered by hosted TDD."
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

Canonical `tiangong-lca/portal` 已有可写的 `main`，并已作为 `portal` 纳入 workspace 的 M1 分支策略、delivery adapter、Docpact 路由与精确 root gitlink integration 流程。Root gitlink 不自动跟随 child `main`；每个需要 workspace integration 的 release 仍须单独 pin 经审阅的 exact Portal SHA。仓库接入完成不代表 R0、R1 或 EdgeOne Production release readiness。

Portal #33/PR #34 已把实现收敛为最终公众产品：`zh-CN`、`en`、`de`、`fr` 四套独立路由与词典没有 UI 回退；首页、搜索、方法说明、候选清单、详情、比较和错误/空态已移除开发阶段标签、raw rank/score/reason code 与内部架构话术，并以 TIDAS 术语、Next locale style guide 和 Docs 的公众任务语言为依据。首页、Browse、identifier/keyword Search、Process/Flow 固定版本详情与 Versions、Exchanges、publication-bound LCIA、比较、引用、浏览器候选清单、locale-correct 初始 `<html lang>`、SEO/JSON-LD、品牌、axe/no-JS/forced-colors/200% zoom/四语 Playwright 均通过。Catalog sitemap 消费 Database 固定 64 个 opaque shard，每个 shard 切成 4 个确定性公开 part；每个 catalog index 固定 256 项，并为四种语言生成 reciprocal URL，严格小于 5 MiB。

首次公开 TDD 在 exact `dpdgfqylc0dw@9bcb45d` 发现默认 Search 的服务端 payload/SSR 性能缺陷：20 条结果约 705 KB，折叠 facet 仍在初始 HTML 中渲染 141 个链接，10 次样本 TTFB p95 为 2.39 秒。Portal #35 将默认结果页收敛为 10 条、每组 facet 最多渲染 8+8 个值并明确提示继续缩小条件；显式 `limit=1..50`、排序、cursor、可见性和 Database RPC 不变。缓存详情 TTFB p75 509ms，首页/详情 LCP、INP、CLS 均已在预算内。

R2 Intelligent Discovery 复用同一 HMAC signer，通过同源 POST 调用专用 `portal_hybrid_search_v1`；界面只显示面向用户的“智能搜索”、查询理解和公开匹配原因，不暴露 BFF、POST、rank、score、reason code 或 provider 细节。EdgeOne 已增加 `/internal/hybrid` 精准频控，Supabase 已配置 10 次/分钟、100 次/日、并发 2 的原子预算。第一次获批付费的 cold/warm 探针均在约 9–10 秒后安全回退为 `hybrid_upstream_unavailable`；按熔断原则已恢复 `PORTAL_HYBRID_ENABLED=false`，待定位 OpenAI/SageMaker 阶段后再用仍有效的付费授权复测。

EdgeOne Production 绑定 `portal/main` 与 `portal.tiangong.earth`，同一环境承担 hosted TDD 和发布；feature/PR 不创建独立 Preview。`dpdgfqylc0dw@9bcb45d` 已启用公开索引与 enforcing performance CSP：允许 Next App Router 缓存式 hydration 必需的 inline script/style，禁止 `unsafe-eval` 并严格限制其他 source/object/base/form/frame 权限。构建日志证明仓库 `.node-version` 将 builder 切到 Node 24.18.0，托管 SSR 为 Node 20.19.3；EdgeOne 设置页错误展示可选 24.18.0、保存 API 却拒绝并只允许到 24.11.0，因此保持仓库 engine-strict 基线，不降级 package engine。未知首段 raw HTML 的 `__next_error__` 包装仍是真实上游 bug；Portal 保持真实 404、noindex 与原 URL，不以软跳转或牺牲 ISR 的方式伪装修复。上线后的 RUM 为 7 天非阻断观察。`dppeqhecdjax@82e9edb` 仍是 signer cutover 的不可变证据，品牌 custom/rollback 证据为 `dpx9m06806fi` / `dpzbmb1u15np`。Release #59/#60 由上游继续审核；真实 publication/readback 尚未声称完成。
