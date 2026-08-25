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
lastReviewedAt: 2026-08-26
lastReviewedCommit: bba412b64865911b8845f9a6a696dbbd29a6f377
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

- [产品与技术方案](docs/design-plan.md) —— 当前唯一主文档，覆盖产品、UI、权限、数据契约、SEO、EdgeOne、测试、跨仓交付与仓库 onboarding。

## 状态

最终实施方案已定稿，Phase 0 repository/runtime bootstrap 正在进行。Portal 已成为独立本地 Git 仓库；canonical 远端与 workspace 子模块 onboarding 尚未完成。
