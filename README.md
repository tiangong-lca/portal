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
lastReviewedAt: 2026-09-07
lastReviewedCommit: 4c25b464944b13d27c9a9dfa34a5b30f15b60338
lastReviewedNote: "Reviewed for Portal #61: local Storybook MCP, component manifests, isolated docgen compiler and Git-ignored project skills preserve anonymous public reads, four locales, production bundles, CSP and hosted-evidence boundaries."
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
- **谨慎比较**：只有现有公开字段中的功能单位、方法、地区、时间和 publication 背景满足条件时，才并列展示数值；系统边界与研究适用性仍需使用者核对，不能把字段一致当作科学审查结论。

## 技术形态

Next.js App Router 前后端同构，React Server Components 优先，部署到 EdgeOne Makers。终端用户没有登录态；EdgeOne 后端以 Portal 专用 HMAC 请求签名调用专用 Supabase Edge Functions（如 `portal_hybrid_search_v1`）。数据库读取使用 server-only 的公共只读契约，不使用 service-role；MVP 分享只使用 URL fragment 与 JSON，不写 Redis。默认浅色/深色主色与 `tiangong-lca-next` 一致，其余颜色遵循 shadcn/ui + Tailwind v4 最佳实践，并支持部署级主色、Logo 与 favicon 替换。

## 组件开发与检查

Storybook 复用生产 CSS、生成的品牌 token 和四套词典，集中展示 `src/components/ui` 的全部基础组件及全局导航、搜索筛选、详情、版本、LCIA、比较、候选清单和输入输出表格等业务组合。工具栏可切换语言、浅深主题和视口；业务场景直接使用产品组件，数据为合成 fixture。

在仓库要求的 Node 24.18.x / pnpm 11.24.0 下执行：

```bash
pnpm install --frozen-lockfile
pnpm storybook             # http://localhost:6006
pnpm build:storybook       # 独立静态输出 storybook-static/
pnpm exec playwright install chromium
pnpm test:storybook        # Chromium 渲染、play 交互和 axe 检查
```

配置、stories 和 fixture 均在 `.storybook/`。服务端展示组件在 loader 中直接执行，只有请求级翻译与服务端品牌配置使用 Storybook 专用替代；搜索页和场景共用同一分面组件。清单与主题场景独立初始化并恢复测试 origin 的专用存储键，MSW 拦截同源 API，不需要生产凭据。生成的 worker 仅存在于 `.storybook/public/`；Storybook 不作为 Next 路由或 EdgeOne 发布产物。现有 `pnpm check` 和 `pnpm test:e2e` 继续验证完整产品流程，CI 另外构建和测试 Storybook。`vitest.config.ts` 供 Storybook CLI 和工作台测试面板发现；原有单元/集成配置完整保留于 `vitest.unit.config.ts`，由 `pnpm test` 等脚本显式选择，隔离 Next 配置加载带来的环境注入。

新增或修改共享组件时，补充可复现的正常、空、异常、禁用、长文本或窄屏场景，并对关键行为添加 `play` 断言。无障碍检查统一为 `error`，所有场景执行严格检查。共享控件常规高度为 44px，紧凑控件为 32px；操作组在窄屏按两列排列并允许长标签换行。比较优先显示需要关注的字段，输入输出表通过展开项保留精确标识和展示依据。组合场景覆盖搜索早期结果、显式应用更新、旧请求取消、过期与失败续页，以及清单导入预览、确认、取消、含备注链接和成员上限；请求由 play 显式释放，避免依赖固定延时。下拉菜单展开状态也执行严格无障碍检查，背景不能接收焦点，关闭后恢复原状态。LCIA 数值与单位保持原样，精确数据集及方法版本可逐项展开。场景目录用于发现和讨论现有问题，不代表视觉设计已获认可；目前不包含截图差异基线。

Storybook MCP 由开发依赖 `@storybook/addon-mcp` 提供。`pnpm storybook` 固定监听本机 6006 端口；端口被占用时直接报错，防止 Agent 连接到另一实例。服务启动后，为本机 Codex 添加连接：

```bash
codex mcp add portal_storybook --url http://localhost:6006/mcp
codex mcp get portal_storybook
```

连接写入本机 Codex 配置。新会话加载工具；已有会话可从 Portal 目录运行 `STORYBOOK_FEATURE_AI_CLI=1 pnpm exec storybook ai --help`，按当前 CLI 帮助调用同一组工具。开发流程为 `docs-list` → `docs-show` → 修改组件和 stories → `stories-changed` / `stories-find-by-component` → `test-run`（保留 a11y）→ `review-create`。Story ID 使用工具返回值。服务需要保持运行，静态构建不提供本地开发与测试 MCP 服务。

官方 skills 安装在项目本机目录 `.agents/skills/storybook-{init,setup,stories,upgrade}/`，由 `.gitignore` 排除，不随仓库提交，也不依赖用户级插件。来源为 [Storybook 官方 Codex skills](https://github.com/storybookjs/mcp/tree/cc266eb62129ec00c72d1360ec0cb6a34305a4cf/packages/codex-plugin/plugins/storybook/skills)，每个本地目录保留 LICENSE 和 UPSTREAM.md；仅将技能名称与交叉引用改为 `storybook-` 前缀。更新时重新核对上游。日常使用 `$storybook-stories`；现有工作台无需再次初始化。

组件 manifest 使用 `experimentalReactComponentMeta` 提取完整类型与 `@import` 源码引用，Autodocs 使用 `react-docgen-typescript`。二者仍属于 Storybook 的预览能力。`scripts/pnpm-hooks.cjs` 为指定版本的文档解析器提供独立 TypeScript 6.0.3，因为它们依赖 TypeScript 7 已移除的 JavaScript 编译器 API；产品的 TypeScript 7 工具链保持独立。`pnpm build:storybook` 同时检查全部场景的文档覆盖、导入路径和 Button/Select 的关键 API，升级时必须重新验证。原始文档可在 [manifest 检查页](http://localhost:6006/manifests/components.html) 查看。

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

关键词搜索默认返回 10 条记录；命中的公开版本可展开查看，每组分面最多渲染 8 个常用值和 8 个显式展开值。所有查询只允许 state code 100/200，不把命中版本替换成最新版本。Search HTML 始终 private/no-store；只有页面发起的公共关键词与分面 RPC 使用 30 秒 Next Data Cache，缓存按完整请求区分、tag 不含查询原文、错误不缓存。

自然语言描述搜索先展示可用的普通结果，并通过同源 BFF / Portal HMAC 继续智能匹配；新结果较晚完成时显示“搜索结果有更新”，由用户主动切换，当前阅读和选择保持不变。向量输入先改写为英文，全文检索保留原始所有语言。Hybrid 以每路 200 个有效版本候选为基线，按最佳匹配版本组织数据集并提供有界继续加载；过期或失败不会静默改成第一页。BFF 保留 30 秒完成窗口和现有安全预算，时延用于优化，不设 Hybrid p95 发布门。所有自然语言 POST、早期普通结果与 fallback 均为 no-store。

公开站点采用性能与 SEO 优先的 enforcing CSP、五分钟首页 ISR、locale-correct 初始 HTML、四语 reciprocal metadata、Dataset JSON-LD 与分片 sitemap。真实 404 保留原 URL、`noindex` 和错误状态；EdgeOne 对未知首段生成通用 raw document 的问题按平台缺陷单独跟踪。Portal #37 的 RUM 与七天观察已按用户要求取消，精确托管兼容与发布证据仍记录在 `docs/r0/`。

Portal #48 完成界面与数据使用者文案回归：不透明分层导航、移动端筛选、前置的搜索模式切换、保留筛选的目录跳转、跨页 2–4 版本对比和清晰的可用性标记。清单 V2 保留旧清单及备注，以精确类型和版本展示名称，导入先预览再确认，分享默认仅编号与类型。名称补全每批最多 10 条、最多 4 个公开 RPC 并发，不传输清单名称、用途或备注。

Portal #50 补齐线上抽查发现的过程类型枚举：分面、已选条件和描述搜索摘要使用 Next 已发布的四语词条；原始查询值与未知自定义类型不变，不影响检索结果。

Database 已通过 PR #602 晋级 Main，34 个契约文件重新固定为 `521741a064f402c9b674583ef69a5947d1b5885f`，内容与先前已部署版本逐字节一致，不重跑生产迁移。前端托管发布及 workspace integration 的状态以 [Portal #48](https://github.com/tiangong-lca/portal/issues/48)、[兼容矩阵](docs/r0/compatibility-matrix.md) 和 [workspace #963](https://github.com/tiangong-lca/workspace/issues/963) 为准，不能把本地浏览器验证视为新前端已经上线。
