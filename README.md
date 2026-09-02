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
lastReviewedAt: 2026-09-02
lastReviewedCommit: 60bc35bce656daf21da7b4a0827090fb82c66b2c
lastReviewedNote: "Reviewed for Portal #42: the interactive Hybrid BFF has a dedicated bounded 30-second completion window without changing LCIA, lexical Search caching, SEO/ISR, privacy, or the four-language product shell."
related:
  - AGENTS.md
  - docs/design-plan.md
---

# tiangong-lca-portal

天工 LCA 公共数据门户 —— 面向生命周期评价研究与实践的匿名、只读数据目录。

## 定位

Portal 以数据发现为首要任务：

- **搜索与浏览优先**：按名称、UUID、CAS 号、分类、对象类型、地区或来源进入公开目录。
- **使用背景完整**：记录页同时提供版本、适用范围、来源、许可、方法、质量与可用结果，缺失内容不补写或补零。
- **匿名只读**：无需注册即可使用公共查询、详情、比较、引用与本地候选清单；浏览器不持有 Supabase 或 HMAC 凭据。
- **谨慎比较**：只有功能单位、方法、地区、时间、系统边界与 publication 背景兼容时，才并列展示数值。

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

## 当前状态

Production 由 `portal/main` 自动发布到 `portal.tiangong.earth`，公开站点同时承担托管验收；feature 分支不创建独立 Preview。构建工具链固定为 Node 24.18.x，EdgeOne 托管 SSR 继续遵守已验证的 Node 20 runtime boundary。

公众产品提供 `zh-CN`、`en`、`de`、`fr` 四套独立路由与词典。首页以目录搜索为主，连续的 Process、Flow、地区与来源索引作为浏览入口；详情、版本、输入输出、公开 LCIA、比较、引用、候选清单、错误与空态均使用面向数据使用者的文字。`lca.tiangong.earth` 作为天工 LCA 产品平台入口出现在桌面导航与所有尺寸页脚，不在首页或紧凑导航占用独立宣传区。

关键词搜索默认返回 10 条记录；每组分面最多渲染 8 个常用值和 8 个显式展开值，更多值提示继续缩小条件。Search HTML 始终 private/no-store；只有页面发起的公共关键词与分面 RPC 使用 30 秒 Next Data Cache，缓存按完整请求区分、tag 不含查询原文、错误不缓存。自然语言描述搜索通过同源 BFF 和 Portal HMAC 调用专用 Edge Function；BFF 使用独立、有界的 30 秒完成窗口，优先返回正确 Hybrid 结果，时延只作为优化观测。其 lexical fallback 保持 no-store，预算、并发、Redis guard、上游或开关不可用时不绕过保护措施。

公开站点采用性能与 SEO 优先的 enforcing CSP、五分钟首页 ISR、locale-correct 初始 HTML、四语 reciprocal metadata、Dataset JSON-LD 与分片 sitemap。真实 404 保留原 URL、`noindex` 和错误状态；EdgeOne 对未知首段生成通用 raw document 的问题按平台缺陷单独跟踪，不以软跳转或动态化 ISR 页面掩盖。首次上线后的 RUM 为七天非阻断观察，精确托管兼容与发布证据记录在 `docs/r0/`。
