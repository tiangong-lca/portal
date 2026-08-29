---
title: tiangong-lca-portal 产品与技术方案
docType: plan
scope: repo
status: active
authoritative: true
owner: tiangong-lca-portal
language: zh-CN
whenToUse:
  - when implementing or reviewing Portal product, UI, security, data, deployment, release, or cross-repository behavior
whenToUpdate:
  - when Portal target state, acceptance criteria, owner boundaries, or delivery phases change
checkPaths:
  - docs/design-plan.md
  - AGENTS.md
  - README.md
  - src/**
  - public/**
  - tests/**
  - scripts/**
  - contracts/database-engine/portal/**
  - edgeone.json
lastReviewedAt: 2026-08-29
lastReviewedCommit: 35e9e5154851db3901138133591db22cfaaedfba
lastReviewedNote: "Reviewed for Portal #8: main-only EdgeOne Production TDD, the OpenNext middleware compatibility boundary, exact runtime evidence, deployment configuration and retained release gates align."
related:
  - AGENTS.md
  - README.md
---

# tiangong-lca-portal 产品与技术方案

| 项目 | 约束 |
| --- | --- |
| 状态 | 最终实施方案；仓库治理与 workspace onboarding 已完成，EdgeOne main/Production hosted TDD 已开始，R0/R1 release checklist 尚未完成 |
| 产品形态 | 面向匿名用户的公共 LCA 数据检索与展示门户 |
| 技术形态 | Next.js App Router 前后端同构，部署到 EdgeOne Makers |
| 数据边界 | 只读消费现有数据；不生产、修改、审核或维护 LCA 数据 |
| 权限边界 | 终端用户无注册、登录或会话；EdgeOne 后端使用 Portal 专用 HMAC 请求签名 |
| 机器接口边界 | Portal 不提供开发者 API、GraphQL、MCP 或 Skills 产品 |
| 品牌边界 | 默认浅/深主色与 `tiangong-lca-next` 一致；其余使用 Portal UI 框架最佳实践；主色、Logo、favicon 可替换 |
| 文档原则 | 只描述当前目标状态；变更历史由 Git 承载 |

## 1. 产品定位

Portal 是天工 LCA 的公共发现入口。匿名访问者可以搜索、浏览、理解、比较和引用所有已明确公开的信息，不需要先注册 `tiangong-lca-next`。

核心任务链为：

```text
输入需求
→ 识别查询类型
→ 发现公开 Process / Flow
→ 查看版本、来源、方法、地理和质量信息
→ 查看已公开的 Exchanges 与 LCIA Results
→ 比较 2–4 个候选
→ 生成引用或整理到本地候选集
```

Portal 的成功标准不是“提供一个数据库表格”，而是让用户在不登录的前提下判断：

- 数据是什么；
- 为什么被召回；
- 适用于什么时间、地区和技术条件；
- 是否存在公开数值；
- 与其他候选是否可比；
- 如何稳定引用具体版本。

## 2. 不可变边界

### 2.1 Portal 负责

- 公开数据的匿名搜索、浏览和详情展示；
- 公开 LCIA 结果的只读展示；
- 版本固定链接、引用、比较和本地候选集；
- SEO、国际化、无障碍、主题和响应式体验；
- 对查询解释、匹配依据、代理关系和字段来源做忠实呈现；
- 通过服务端只读适配层消费 Database 与 Edge 已授权的公共契约；
- 在 EdgeOne 后端使用 Portal 专用 HMAC 凭据签名 Portal 专用 Supabase Edge Function 请求。

### 2.2 Portal 不负责

- 注册、登录、账户、团队或权限管理；
- 私有数据、团队数据、草稿或审核中数据；
- 数据创建、导入、编辑、审核、发布、撤回、修复或重算；
- 过程规范化合并政策和人工复核队列；
- 开发者 API、GraphQL、MCP、Skills、API Explorer 或代码示例；
- LCI/LCIA 求解、Calculation Bundle、私有制品下载或数据产品发布；
- 购买、许可交易或商业数据交付闭环；
- 把浏览器本地状态描述为不可篡改或合规审计记录。

Portal 没有后台机器用户、登录页面或浏览器 token/cookie。高级能力统一外链到 `tiangong-lca-next`；Portal 不共享终端用户登录态，也不在本项目复制其 API、MCP 或 Skills 实现。

## 3. 跨项目职责

| 项目 | 责任 | 与 Portal 的关系 |
| --- | --- | --- |
| `tiangong-lca-portal` | 公共匿名只读 Web 产品 | 消费公共契约并负责页面体验 |
| `tiangong-lca-next` | 登录后的产品工作台、私有/团队数据与高级能力 | 仅作为行为与数据访问模式参考；默认不改代码 |
| `database-engine` | Schema、RPC、RLS、ACL、索引和公共读取 façade | 为 Portal 提供固定公共范围的权威只读契约 |
| `tiangong-lca-edge-functions` | Hybrid Search、查询改写、Embedding、发布态 LCIA 投影与滥用防护 | 为匿名终端用户提供仅受 HMAC 服务端调用的公共读取入口 |
| `tiangong-lca-worker` | 求解、计算证据和长任务 | Portal 不直接调用；只有公共发布范围改变时才需要修改 |
| `tiangong-lca-release` | LCI/LCIA 发布控制面 | Portal 只读取已经公开的发布投影 |
| `tidas` / `tidas-sdk` | 对象、Schema 和类型事实 | Portal 的术语和字段解释以 TIDAS/ILCD 为准 |
| `data-foundry` / `cli` / `tidas-tools` | 数据生产、导入、验证和转换 | Portal 不参与 |
| `lca-workspace` | 多仓治理、tracked delivery 和精确子模块集成 | 在所有子仓交付完成后集成精确 SHA |

## 4. 公共数据与权限契约

### 4.1 可见范围

Portal 的公共候选范围固定为：

- `state_code = 100`；
- `state_code = 200`。

`state_code = 0`、`20` 以及任何用户、团队、审核或内部状态永远不进入 Portal。调用者不能通过 URL、请求体、Header 或 RPC 参数扩大范围。

`state_code` 是工作流状态，不直接等于许可证。前端不以状态码猜测可见能力；后端公共 DTO 必须显式返回能力及其证据：

```ts
type PublicCapabilities = {
  metadataVisible: true;
  exchangesVisible: boolean;
  lciaVisible: boolean;
  publicArtifactVisible: boolean;
  citationVisible: true;
  policyVersion: string;
  reasonCodes: string[];
};
```

能力的唯一权威来源为：

| 能力 | 权威计算者 | 成立条件 |
| --- | --- | --- |
| `metadataVisible` | `database-engine` 公共 façade | exact row 为允许对象类型且状态为 100/200 |
| `exchangesVisible` | `database-engine` 公共 façade | metadata 可见，且数据集许可/公开策略明确允许 exchange projection |
| `lciaVisible` | `data_product_results` 公共 publication | 当前 public publication 包含 exact Process 版本及请求方法 |
| `publicArtifactVisible` | `lca_release_results` | 返回 exact release/public artifact descriptor |
| `citationVisible` | `database-engine` 公共 façade | metadata 可见且 identity/version 完整 |

Portal 只能进一步隐藏能力，不能把 `false` 改成 `true`。

当前产品规则：

- 100 与 200 的允许元数据均公开；
- 200 当前强制映射为 `accessLevel="metadata_only"`；
- 100 只有在 Database 许可投影确认公共数值能力时映射为 `accessLevel="open"`，否则同样使用 `metadata_only`；
- Exchanges、LCIA 或下载只在权威公共投影明确返回相应 capability 时展示；
- 缺少公开结果显示“未发布或不可提供”，绝不显示为数值 0；
- 未来即使 200 出现数值，也必须先由 Database / Worker / Release / Edge 的发布与许可契约明确授权，Portal 才能显示。

### 4.2 接入基线

- Process/Flow lexical RPC 只作为可复用查询内核；Portal 统一通过 §10.2 的 public façade 获得固定 scope、字段投影、排序和 cursor。
- Raw core table、通用版本 RPC 和数据库 JSON row 都不是匿名详情契约。
- `process_hybrid_search` 保持既有消费者语义；Portal 只调用 §10.3 的专用 HMAC 入口。
- `data_product_results` 的发布态投影作为 §10.4 的内部内核；Portal 只调用带 HMAC、滥用防护和证据校验的 wrapper。
- `api.hybrid_search_*_v2` 需要 query embedding；浏览器和 Portal BFF 均不生成或直传 embedding，由 Edge 完成 query rewrite、embedding 和 RPC 编排。

每个 owner repo 的实现 Issue 必须记录 exact SHA、目标环境、去敏请求 fixture 和 probe 输出，并在 Preview、persistent Dev、promoted Main 的适用阶段重跑。任何 probe 结果都只作为发布证据，不能替代版本化契约。

### 4.3 公共 DTO

所有 Portal 数据响应采用版本化、白名单 DTO，不把数据库 raw row 当成产品契约。Phase 1 必须在 `database-engine/contracts/portal/portal.public-dataset.v1.schema.json` 固化 exhaustive JSON Schema，所有 object 均 `additionalProperties: false`，并生成 Portal TypeScript 类型；下面是该 Schema 必须覆盖的结构：

Portal 仓库把一个 exact promoted Database commit 的全部 `contracts/portal/*.schema.json` 与 `generated/*.d.ts` 机械同步到 `contracts/database-engine/portal/**`。该目录不由 Portal 格式化或手工修改；版本化 manifest 固定 canonical repo、40 位 source commit、闭合文件清单、byte length 与 SHA-256。`pnpm check:database-contracts` 每次验证本地 snapshot，提供 Database checkout 时再逐文件对比 Git object。运行时 Zod 仍执行严格 fail-closed 解析，TypeScript DTO 直接使用该 generated contract；不能用 Portal 手写类型替代或通过放宽 Schema 消除 drift。

```ts
type PublicDatasetKey = {
  kind: "process" | "flow";
  id: string;
  version: string;
};

type LocalizedText = Array<{ language: string; value: string }>;

type PublicSource = {
  databaseId: string | null;
  databaseVersion: string | null;
  sourceRecordId: string | null;
  providerName: LocalizedText;
  licenseId: string | null;
  licenseUrl: string | null;
};

type PublicProcessMetadata = {
  kind: "process";
  names: LocalizedText;
  generalComment: LocalizedText;
  referenceProduct: LocalizedText;
  functionalUnit: {
    amount: string | null;
    unit: string | null;
    description: LocalizedText;
  };
  classifications: Array<{
    system: string;
    code: string;
    label: LocalizedText;
  }>;
  geography: {
    code: string | null;
    label: LocalizedText;
    precision: "country" | "province" | "city" | "other" | "unknown";
  };
  referenceYear: number | null;
  validUntilYear: number | null;
  technology: LocalizedText;
  dataSetType: string | null;
  allocationAndModeling: LocalizedText;
  cutoffRules: LocalizedText;
  quality: {
    reviewStatus: string | null;
    timeRepresentativeness: string | null;
    geographyRepresentativeness: string | null;
    technologyRepresentativeness: string | null;
    completeness: string | null;
    uncertainty: string | null;
  };
  source: PublicSource;
};

type PublicFlowMetadata = {
  kind: "flow";
  names: LocalizedText;
  synonyms: LocalizedText;
  generalComment: LocalizedText;
  casNumber: string | null;
  flowType: "product" | "elementary" | "waste" | "other" | "unknown";
  classifications: Array<{
    system: string;
    code: string;
    label: LocalizedText;
  }>;
  locationOfSupply: { code: string | null; label: LocalizedText };
  referenceFlowProperty: {
    id: string;
    version: string;
    name: LocalizedText;
  } | null;
  source: PublicSource;
};

type FieldOrigin = {
  path: string;
  kind: "original" | "normalized" | "derived" | "ai_inferred";
  ruleId: string | null;
  ruleVersion: string | null;
  confidence: "high" | "medium" | "low" | null;
  reason: LocalizedText;
};

type PublicProvenance = {
  importBatchId: string | null;
  normalizationRuleVersion: string | null;
  fieldOrigins: FieldOrigin[];
};

type PublicPublication = {
  publicationId: string;
  packageId: string;
  packageVersion: string;
  publishedAt: string;
  lciaMethods: Array<{ id: string; version: string }>;
} | null;

type PublicDatasetEnvelope = {
  schemaVersion: "portal.public-dataset.v1";
  key: PublicDatasetKey;
  accessLevel: "open" | "metadata_only";
  capabilities: PublicCapabilities;
  metadata: PublicProcessMetadata | PublicFlowMetadata;
  provenance: PublicProvenance;
  publication: PublicPublication;
  modifiedAt: string;
};
```

字段白名单必须完整覆盖许可允许公开的 TIDAS/ILCD 元数据，包括数据集信息、时间、地理、技术、建模/分配、质量、合规、行政、publication/ownership 和来源；它用于剥离内部运维字段，不得成为任意删减公开元数据的借口。公共 Schema 新增字段时，Database 契约测试必须明确决定“公开并映射”或“内部并剥离”，并在不兼容时升 schema major version。

DTO 不返回：

- `user_id`、`team_id`、review/membership 信息；
- private bucket、object path、service locator 或签名凭据；
- embedding、搜索派生内部列或内部排名调试字段；
- 未授权的 Exchanges 或 LCIA 数值；
- 原始数据库错误、SQL 细节或内部函数名。

### 4.4 撤回与不存在

- 从未公开、非法 ID、越权访问：`404 Not Found`；
- MVP 对已撤回版本同样返回 `404`，避免泄露历史存在性，也避免依赖当前不存在的 tombstone；
- `410 Gone` 仅作为扩展：必须先由 `database-engine` 的 publish/withdraw 命令事务性维护 durable public tombstone，并通过 EdgeOne/Next exact status compatibility test；
- 当前版本别名不存在：`404`；
- LCIA publication 切换或缺失：详情页仍可用，LCIA 区单独显示明确状态。

## 5. 对象范围

### 5.1 MVP 一等对象

| 对象    | 搜索 | 详情 | 版本 | Exchanges          | LCIA                      | 比较         |
| ------- | ---- | ---- | ---- | ------------------ | ------------------------- | ------------ |
| Process | 是   | 是   | 是   | capability 允许时  | public publication 允许时 | 是           |
| Flow    | 是   | 是   | 是   | Flow Property 关系 | 不适用                    | 仅元数据对照 |

### 5.2 后续对象

- LCIA Method：在稳定公共详情与版本契约存在后升级为一等对象；
- Database / Data Package：必须先有稳定 identity、覆盖统计和来源契约；
- EPD / Document：先作为 Process subtype 或关联文档展示，不虚构独立实体；
- Provider：在 Contact / Source 与提供方 identity 的映射稳定后再开放；
- LifecycleModel：属于登录后的分析工作流，除非出现明确公共展示契约，否则不进入 Portal。

没有上游契约的对象、Process Group、聚合依据、字段来源或匹配理由不得由 Portal 自行推断后冒充事实。

## 6. 信息架构与路由

首发语言为 `zh-CN` 与 `en`，语言进入路径。根路径只做语言协商，不承载内容。

| 路由 | 用途 | 渲染 | 索引 |
| --- | --- | --- | --- |
| `/:locale` | 首页 | SSG/ISR | `index,follow` |
| `/:locale/search?...` | 搜索与分面 | SSR/RSC | `noindex,follow` |
| `/:locale/process/:uuid@:version` | Process Overview | SSR/RSC + Data Cache | `index,follow` |
| `/:locale/process/:uuid@:version/exchanges` | Exchanges 分页 | SSR/RSC + Data Cache | `index,follow`，正文需有摘要 |
| `/:locale/process/:uuid@:version/lcia` | 公开 LCIA | SSR/RSC + Data Cache | `index,follow` |
| `/:locale/process/:uuid@:version/method` | Scope & Method | SSR/RSC + Data Cache | `index,follow` |
| `/:locale/process/:uuid@:version/quality` | Data Quality | SSR/RSC + Data Cache | `index,follow` |
| `/:locale/process/:uuid@:version/provenance` | Provenance | SSR/RSC + Data Cache | `index,follow` |
| `/:locale/process/:uuid@:version/versions` | 版本列表与 diff 摘要 | SSR/RSC + Data Cache | `index,follow` |
| `/:locale/process/:uuid` | 最新版本别名 | 动态 307 到精确版本 | 不单独索引 |
| `/:locale/flow/:uuid@:version` | Flow 详情 | SSR/RSC + Data Cache | `index,follow` |
| `/:locale/flow/:uuid@:version/versions` | Flow 版本列表与精确链接 | SSR/RSC + Data Cache | `index,follow` |
| `/:locale/compare?ids=...` | 2–4 条比较 | SSR/RSC + Client island | `noindex,follow` |
| `/:locale/browse/:dimension` | 受控目录浏览 | ISR/RSC | 仅规范目录页可索引 |
| `/:locale/collections` | 本地候选集 | Client island | `noindex,nofollow` |
| `/:locale/methodology` | 方法论与字段解释 | SSG | `index,follow` |
| `/:locale/databases` | 数据库目录 | 扩展阶段 | `index,follow` |
| `/:locale/map` | 地图 | 扩展阶段 | `noindex,follow`，提供等价表格 |

详情页的“标签页”使用真实子路由，不把主要内容藏在仅客户端可见的 Tab 内。这样可以深链、无 JavaScript 阅读并生成独立 metadata。

Portal 不创建 `/api` 页面，不展示 REST/GraphQL/MCP/Skill 示例。

## 7. 页面与交互

### 7.1 首页

首页保持克制：

1. 主搜索框；
2. 真实可执行示例：UUID、CAS、分类码；HMAC-signed Hybrid 达到 Phase 3 退出条件后再加入自然语言示例；
3. Process / Flow、行业、地区、数据库目录入口；
4. 当前公共内容规模与最近公开更新时间；
5. “需要高级功能？”外链到 `tiangong-lca-next`。

首屏不放营销 KPI 卡片、聊天窗口或登录 CTA。`/` 聚焦搜索；在输入控件内不劫持快捷键。

### 7.2 搜索页

桌面端采用三栏：动态分面、结果、选择托盘。中尺寸将分面收进 Sheet，托盘变为浮动按钮；移动端单列。

搜索流程：

```text
输入解析
├─ UUID / CAS / 分类码：直接 lexical/identifier RPC
├─ 普通关键词：canonical lexical RPC
└─ 自然语言：same-origin POST，由 EdgeOne 后端签名后调用 Hybrid；故障时回退 lexical
```

结果行只展示有证据的数据：

- 名称、参考产品/流、功能单位、地区与精度、参考年、技术路线；
- 数据源、版本、访问能力、审核/质量状态；
- 后端返回的匹配理由；
- `选择`、`详情`、`复制引用`。

动态分面计数必须来自后端全结果集聚合，不能由当前页样本推算。首批分面限于已具备索引和稳定字段的：对象类型、访问能力、地区、参考年、Process subtype、数据源。分配方法、技术路线和质量分面在真实数据覆盖与索引验收后加入。

Process Group 只有在上游返回稳定 `groupId`、成员和逐条依据时才启用；默认使用原始 Process 平铺，不在 Portal 自建合并规则。

查询理解卡、匹配理由、代理链、置信度或排除原因只有在 Edge 响应携带结构化 evidence 时展示。AI 失败不能阻塞基础关键词检索。

### 7.3 Process 详情

固定头部显示：规范化名、原始名、`uuid@version`、公开能力、地区精度、版本切换和操作条。

操作条仅包含：

- 比较；
- 加入本地候选集；
- 引用；
- 打开 `tiangong-lca-next`。

内容子路由：

- Overview：名称、参考产品、功能单位、地区、参考年、技术与公开能力；
- Scope & Method：系统边界、功能单位、分配与建模方法、截止规则；
- Exchanges：技术流、基本流、废物流，服务端分页；
- LCIA：公开 publication 下的指标、值、单位、方法、功能单位和发布时间；
- Data Quality：时间、地理、技术代表性、完整性、不确定性和审核；
- Provenance：来源库、记录 ID、导入批次、规范化规则版本；
- Versions：历史版本、变更摘要和精确链接；
- Relationships：扩展阶段，只有稳定关系契约存在时提供。

### 7.4 比较

比较 2–4 条 Process。第一屏先输出可比性矩阵，再决定是否并列数值。

判定维度：功能单位、参考流与单位、分配与建模方法、地理代表范围与精度、参考年、技术路线、截止规则、LCIA 方法和 publication。

判定档位：

- 直接可比；
- 换算后可比；
- 仅作参考；
- 不可比。

单位换算仅使用明确、版本化的换算契约。任何代理、推断或地理精度不一致必须在结论附近说明。LCIA 数值只有在所有成员都有公开结果且方法/单位满足条件时并列；否则只做元数据对照。

### 7.5 本地候选集

候选集是“本地评审辅助集”，不是合规审计系统。它记录研究名称、用途、精确版本成员、候选/排除/采用状态、理由和查询快照。

界面持续提示：

- 仅保存在本浏览器；
- 可能被浏览器清理；
- 不跨设备自动同步；
- 可导出 JSON 并在另一设备导入。

### 7.6 方法论

公开说明：

- 100/200 与访问能力的关系；
- TIDAS/ILCD 对象与术语；
- 字段来源标记；
- Hybrid Search、AI 推断和代理建议边界；
- 可比性规则；
- 地理精度纪律；
- 数据更新时间与撤回处理；
- 数据问题反馈的外部既有入口。

Portal 不实现匿名反馈写入接口。

## 8. URL、浏览器状态与分享

### 8.1 URL 状态

查询参数采用版本化 schema，首个参数为 `v=1`。URL 可以包含：

- identifier/lexical `q`、对象类型、分面、排序、密度；
- 页游标的可序列化 token；
- 比较集合，最多 4 个 `uuid@version`。

GET 中的 identifier/lexical `q` 会进入浏览器历史、EdgeOne access URL 和其默认 24 小时平台日志，界面必须提示不要输入机密内容；应用日志不得再次复制它。跨域 Referrer Policy 固定为 `strict-origin-when-cross-origin`，不向外站发送 path/query。

自然语言 Hybrid 原文不进入 query string：Client island 通过 same-origin POST 提交，Route Handler 与 Edge 均禁止记录 body；刷新恢复使用本地 session state，只有用户显式“分享此查询”时才将原文放入 fragment 并显示泄露预览。研究名称、备注、采用/排除理由同样不进入 query string。

所有参数由 Zod 严格解析；未知键忽略，非法值回退到安全默认值，超长输入返回可理解的 400 页面而不是 500。

MVP 输入上限：查询 512 个 Unicode code points、解码后的 query string 8 KB、比较 ID 4 个、普通页 50 行。本地 JSON 导入上限 1 MB；候选集 fragment 只在成员不超过 20 且编码后不超过约 1.5 KB 时启用。

### 8.2 localStorage

键名包含 schema 版本，例如 `tiangong.portal.collections.v1`。读取时执行 schema 校验和迁移；损坏数据被隔离并允许下载原始内容后清除，不直接传入 DOM。

### 8.3 分享

MVP 只提供：

- identifier/lexical 查询与比较 permalink；
- 只含精确成员 ID 的小型候选集压缩 URL fragment；
- 版本化 JSON 导出/导入。

Fragment 不发送到服务器，但会进入浏览器历史并对链接接收者可见。R1 不把自然语言查询、备注、采用理由或排除理由写入 fragment；超出上限时只提供 JSON，不自动写 Redis。

R2 才提供“分享 Hybrid 查询”或“分享含备注的集合”。只有用户显式选择相应动作并确认完整泄露预览后，才把选中的查询或备注编码到 fragment；默认分享始终只含精确成员 ID。

服务端 Redis 短链属于扩展阶段的显式例外，只有在单独批准匿名写入、隐私、TTL、续期、删除、限流与滥用策略后才实施。它只能存集合定义，不能复制数据本体。

## 9. Next.js 架构

```text
Browser
├─ URL / fragment / localStorage
├─ Client islands：搜索输入、分面、托盘、主题、快捷键
└─ EdgeOne Makers
   └─ Next.js App Router
      ├─ React Server Components：页面与 SEO HTML
      ├─ server-only query domain
      │  ├─ Database public RPC façade
      │  ├─ Edge HMAC-signed hybrid
      │  └─ Edge published LCIA / release projection
      └─ Next cache：TTL、tags、request dedupe
```

### 9.1 服务端优先

- 页面默认 Server Component；
- 数据读取、DTO 验证和权限收敛全部在 `src/server/**`，入口包含 `import "server-only"`；
- Client Component 只承载必须使用浏览器 API 或即时交互的部分；
- Identifier/lexical 搜索使用 GET 导航；自然语言 Hybrid 是明确的 JavaScript 增强并使用 same-origin POST；
- Suspense 分段流式渲染慢模块，主元数据先返回；
- `loading.tsx`、`error.tsx` 和 `not-found.tsx` 各自有明确界面；410 只在扩展 tombstone 契约通过后加入。

### 9.2 不复制 Next 项目代码

`tiangong-lca-next` 是 Umi SPA，其 Supabase singleton 持久化用户 session，服务函数也包含 Umi、Ant Design、认证和编辑工作流假设。Portal 不直接导入或复制 `tiangong-lca-next/src/services/**`。

复用的是：

- Supabase 的 `api` schema 与既有 RPC 语义；
- Edge Hybrid / LCIA 的权威业务入口；
- TIDAS 类型与静态参考数据契约；
- fail-closed schema allowlist、错误收敛和证据校验思路。

### 9.3 内部服务端入口

Portal 不形成第三方 API 产品。Route Handler 或 Server Action 仅允许：

- 框架页面所需的内部 UI BFF；
- sitemap、robots 和 metadata；
- 以后经批准的缓存失效或短链动作。

这些入口不发布 OpenAPI、不承诺外部稳定性、不展示开发者文档。可以用 Server Component 直取时，不新增 Route Handler。

## 10. 数据访问设计

### 10.1 Portal 服务端客户端

默认使用原生 `fetch` 调用相同的 Supabase `api` RPC 与 Edge Function 入口，原因是：

- 与 Next.js cache/revalidate 原生集成；
- 不把 Supabase 客户端带入浏览器；
- 无需 session/cookie/auth SDK；
- 避免 EdgeOne SSR 运行时版本与最新 `supabase-js` Node engine 不一致。

环境变量：

- `SUPABASE_URL`；
- `SUPABASE_PUBLISHABLE_KEY`；
- `SITE_URL`；
- `PORTAL_SITEMAP_CACHE_MODE`，默认 `no-store`；仅经托管 CDN 证明后使用 `shared-300`；
- `PORTAL_EDGE_KEY_ID`；
- `PORTAL_EDGE_HMAC_SECRET`；
- 可选的 Edge endpoint 与超时配置。

EdgeOne Production 签名端只持有一个当前 `keyId/secret`。Supabase Edge Function 验证端在正常状态只持有 current，在无停机轮换窗口短期持有 current + previous keyring；本地/CI Dev fixture 与 Main/Production 使用完全不同的 keyId/secret。签名密钥绝不进入 `NEXT_PUBLIC_*`、HTML、Cookie、浏览器 bundle、日志或错误响应。Portal 绝不配置 `service_role`、Supabase secret key 或用户凭据。Publishable key 虽可公开，仍保持 server-only，因为浏览器没有直连需求。

若 EdgeOne compatibility spike 证明 SSR 运行时为 Node 22+，仍可评估 `@supabase/supabase-js`；它不是 MVP 必需依赖，也不得改变权限模型。

### 10.2 Database 公共 façade

`database-engine` 新增版本化 read façade，建议命名：

- `api.portal_search_processes_v1`；
- `api.portal_search_flows_v1`；
- `api.portal_get_dataset_v1(kind, id, version)`；
- `api.portal_list_versions_v1(kind, id, cursor, limit)`；
- `api.portal_list_process_exchanges_v1(process_id, process_version, exchange_kind, cursor, limit)`；
- `api.portal_facets_v1(kind, query, filters)`；
- `api.portal_sitemap_manifest_v1()`；
- `api.portal_sitemap_shard_v1(shard_cursor)`。

Exchange façade 返回 `portal.public-exchange-page.v1`：

```ts
type PublicExchangeRow = {
  internalId: string;
  kind: "technosphere" | "elementary" | "waste";
  direction: "input" | "output";
  flow: { id: string; version: string; name: LocalizedText };
  classification: { system: string; code: string; label: LocalizedText } | null;
  amount: string;
  unit: string;
  isQuantitativeReference: boolean;
  uncertainty: {
    type: string;
    minimum: string | null;
    maximum: string | null;
  } | null;
  origin: FieldOrigin[];
};

type PublicExchangePage = {
  schemaVersion: "portal.public-exchange-page.v1";
  process: { id: string; version: string };
  processContext: {
    functionalUnit: {
      amount: string | null;
      unit: string | null;
      description: LocalizedText;
    };
    capabilityPolicyVersion: string;
  };
  rows: PublicExchangeRow[];
  nextCursor: string | null;
};
```

数值上下文按数值类型分别验收，不能用 LCIA publication 条件套 Exchange：

| 数值类型 | 必须同屏或同表关联的上下文 |
| --- | --- |
| Exchange amount | exact Process ID/version、exchange internal ID/kind/direction、exact Flow ID/version、amount、unit、quantitative-reference 标记、Process functional unit、capability policy version |
| LCIA result | exact Process ID/version、functional unit、地理与精度、参考年、LCIA Method ID/version、impact category ID/name、value、unit、publication/package ID/version、publishedAt |
| Quality/uncertainty value | exact dataset ID/version、维度名、量表/单位、来源字段或规则版本；缺少量表时只显示原文而不画可比较刻度 |

任何上下文缺失都隐藏对应可视化并显示“上下文不完整”，不能把该数值并入比较。

所有 Exchange、functional-unit、uncertainty 与 LCIA 数值在 DTO 中使用规范化十进制字符串，禁止先转成 JavaScript `number`；Schema 固定格式/范围，Portal 只在格式化或比较边界使用精确 decimal 库。

要求：

- 公共 scope 在函数内部固定为 100/200；
- Search façade 在数据库内联合 100/200，返回同一算法生成的 `rankKey + kind + id + version` cursor；Portal 不分别请求 `tg/co` 后拼接不可比较分数；
- 不接受 `this_user_id`、`team_id_filter`、`my`、`te` 或任意状态码；
- Filter、Sort、Kind、Limit 全部 allowlist；
- `limit <= 50`；sitemap manifest 固定返回 64 个按位置排序、全局互斥的 opaque cursor，Portal 只能原样回传，不能解码、合成或放入公开 URL；
- sitemap shard 最多 4,096 条、JSON 最多 2 MiB、Database statement timeout 4 秒；Process/Flow 可以混合返回，Portal 只按公开路由中的 kind 过滤；
- 列表使用 cursor/keyset；混合排名游标包含 score + stable ID；
- DTO 做字段投影，200 不返回未经授权的数值；
- `SECURITY DEFINER` 仅在确有必要时使用，固定 `search_path`，`REVOKE ... FROM PUBLIC`，精确 signature 仅 grant 给 `anon`/`authenticated`；
- 使用受限、non-login、non-BYPASSRLS executor；
- 每条 signature 纳入 capability manifest 和 SQL 回归测试；
- 用真实规模 `EXPLAIN (ANALYZE, BUFFERS)` 决定 JSONB、PGroonga、partial 或 covering index，不凭小型 seed 猜测。

### 10.3 HMAC-signed Hybrid Search

`tiangong-lca-edge-functions` 复用现有 query rewrite、SageMaker embedding 和受控检索内核，新增 `portal_hybrid_search_v1`，而不是放宽现有登录端点或复用全局 `SERVICE_API_KEY`。现有 `api.hybrid_search_processes/flows` 仍是登录产品的内部兼容入口：它们按单一 `data_source` 返回 raw `json`、`team_id`/`model_id`，不能直接成为 Portal 契约，也不能在 Edge 拆字段后返回。R2 必须先由 `database-engine` 新增 `api.portal_hybrid_search_v1`，在 Database 内固定联合 100/200、统一排序、public card hydration 与 evidence，再由 Edge 以 publishable key 调用。沿用 Edge 仓库的统一发布契约：本地启动与远端部署脚本都传入 `--no-verify-jwt`，等价于关闭平台网关 JWT 检查；`portal_hybrid_search_v1` 与 `portal_data_product_results_v1` Handler 必须首先验证 Portal HMAC，未通过时不得进入业务逻辑。

凭据采用至少 256-bit CSPRNG 随机 secret，不使用用户密码、Supabase JWT secret 或已有全局 API key。`keyId` 是可记录的非秘密标识，例如 `portal-prod-2026q3`。配置面明确分为：

| 持有方 | 必需 Secrets |
| --- | --- |
| EdgeOne signer | `PORTAL_EDGE_KEY_ID`、`PORTAL_EDGE_HMAC_SECRET` |
| Supabase verifier | `PORTAL_HMAC_KEY_ID_CURRENT`、`PORTAL_HMAC_SECRET_CURRENT`；轮换期再加 `PORTAL_HMAC_KEY_ID_PREVIOUS`、`PORTAL_HMAC_SECRET_PREVIOUS` |

secret 使用 Base64URL 编码保存，启动时解码并强校验长度；缺失、重复 keyId、无法解码或不足 32 bytes 时 fail closed。keyId 可以进入安全指标，secret 永不进入日志。

反重放、route budget 和 concurrency lease 复用 `tiangong-lca-edge-functions/supabase/functions/_shared/redis_client.ts` 的 Redis provider 约定，不引入 Deno KV：

| 运行目标 | Provider | 配置 |
| --- | --- | --- |
| Supabase Dev / Main | Upstash Redis REST | `PORTAL_REDIS_CLIENT_TYPE=upstash`、`PORTAL_UPSTASH_REDIS_URL`、`PORTAL_UPSTASH_REDIS_TOKEN`、`PORTAL_REDIS_NAMESPACE`、`PORTAL_REDIS_TIMEOUT_MS` |
| 本地确定性开发与 CI | Standard Redis | `PORTAL_REDIS_CLIENT_TYPE=standard`、`PORTAL_REDIS_URL`、可选 `PORTAL_REDIS_PASSWORD`、`PORTAL_REDIS_NAMESPACE`、`PORTAL_REDIS_TIMEOUT_MS` |
| EdgeOne hosted R0 security probes | Upstash Redis REST | 复用 Main 的 `PORTAL_REDIS_*`、`PORTAL_UPSTASH_REDIS_*` 与 `portal:main:v1`，只通过真实 Production signed routes 生成 TTL-bounded exact keys |

当前初始部署使用一套经批准的共享 Upstash Redis REST database、endpoint 与 token 覆盖 Supabase Dev 和 Supabase Main/Production。运维将同一源凭据分别写入对应 Supabase project 的 Edge Function Secrets，但运行时只读取 Portal 专用变量，不得回退到既有 Functions 使用的通用 `REDIS_*`、`UPSTASH_REDIS_*` 或其他 provider 凭据。EdgeOne signer、Portal Next.js runtime 和浏览器均不持有 Redis 凭据。

Upstash 导出的 `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` 只属于运维输入格式，可保存在 git-ignored、mode-0600、只含这两个键的本地凭据文件中。Provisioning 进程把它们映射为 `PORTAL_UPSTASH_REDIS_*`，完成后清空子进程凭据；Portal build/runtime 与 Supabase Handler 不直接加载该文件，也不得把导出名当作 runtime fallback。

共享存储下的命名空间与签名身份仍必须完全区分：

- Dev 固定 `PORTAL_REDIS_NAMESPACE=portal:dev:v1`，只配 Dev 的 Portal HMAC keyring 与 Supabase publishable key；
- Main/Production 固定 `PORTAL_REDIS_NAMESPACE=portal:main:v1`，只配 Production 的 Portal HMAC keyring 与 Supabase publishable key；
- Dev fixture 与 Main/Production 的 HMAC keyId/secret、Supabase project 和 signer identity 继续完全不同，不因共享 Redis credential 而复用；EdgeOne 只部署 Main signer；
- EdgeOne hosted probes 只调用 Main/Production，必须使用 exact deployment SHA、Main project ref、Production current key 和 `portal:main:v1`；Handler 只接受平台注入的 current-project URL/key registry；namespace、project、keyId 或 target 不匹配时 fail closed；
- hosted probe 只生成协议正常产生且 TTL-bounded 的 replay/budget/lease/cache keys；禁止广域扫描、模糊 prefix delete、删除共享 Upstash database 或为单次测试轮换共享源 token。

`PORTAL_REDIS_NAMESPACE` 是避免 key 冲突与约束代码路径的逻辑前缀，不是 Redis 权限或安全边界。共享 token 的持有者技术上可以读取、修改或删除所有 namespace；token 泄露、误操作、限额耗尽、provider outage 和 token rotation 也会同时影响 test、Dev 与 Production。初始部署接受这一残余风险，并以独立 HMAC、严格 namespace 校验、短 TTL、hash-only cache key、禁止记录完整 key/value、按环境分指标和 guard fail-closed 降低风险。未来切换为独立 Upstash database/token 只允许是配置收敛，不得改变协议或业务语义。

共享 Redis 风险由 workspace coordination `tiangong-lca/workspace#739` 持有，Portal 完成 onboarding 后转由关联的 Portal R1 release Issue 共同持有，并在每次 Production deployment 前重新确认。出现 token 暴露或疑似泄露、跨环境 key 写入、共享配额/故障影响 Production、无法协调的紧急 rotation、合规要求变化，或 provider 已能提供独立 credential 时，Production no-go，必须切换独立 Upstash database/token 或完成单独批准的风险处置。共享 token 的轮换是覆盖 R0/Dev/Main secret copies 的同一协调事件，不能按单一环境局部执行。

Hosted R0 probe 在第一次 Redis mutation 前写入 mode-0600 receipt；receipt 只含 schema version、exact Production route、fixture 时间与 key-derivation version，不含 endpoint、token、HMAC、nonce、请求体、完整 key 或 value。受控 probe 必须能由固定输入推导其 exact key 并等待受控 TTL 到期或逐键确认回收，禁止使用无界 `SCAN`、模糊 prefix delete 或 database delete。

`PORTAL_REDIS_TIMEOUT_MS` 默认 500，超时按 guard unavailable 处理。

Edge R1 工作必须扩展 shared Redis adapter，而不是在 Handler 内直接拼命令：

- `redisSetNxEx(key, value, ttlSeconds)` 同时支持 Upstash 与 Standard Redis，并返回是否成功占位；
- `redisEvalAtomicGuard(...)` 用 Lua 或等价单次原子事务完成预算扣减与 concurrency lease；
- Portal guard key 分别使用 `replay`、`budget`、`lease`、`cache`、`circuit` 子命名空间，禁止与 user API key auth cache 共用 key；
- 配置缺失、连接失败、超时或响应无法解析时抛出稳定的 `guard_unavailable`，不得降级为无 guard 执行；
- adapter 和 Handler 不记录 Redis token、完整 key、nonce、请求体或缓存 value。
- `supabase/.env.example` 与 Edge README 必须列出 provider、namespace、timeout 和本地/托管配置名称，但不包含任何凭据值。

浏览器只 POST 到 Portal same-origin BFF。BFF 读取原始 body bytes，生成：

```text
bodyHash = base64url(SHA-256(rawBody))
canonical = "portal-hmac-v1\n"
          + keyId + "\n"
          + timestamp + "\n"
          + nonce + "\n"
          + method + "\n"
          + functionPath + "\n"
          + bodyHash
signature = base64url(HMAC-SHA-256(secret, canonical))
```

规范化规则固定为：`method` 使用大写 `POST`，`functionPath` 使用 `/functions/v1/<function-name>`，timestamp 是无前导零的十进制 Unix seconds，nonce 是无 padding 的 128-bit Base64URL；请求体先按 UTF-8 JSON 序列化一次，签名和发送复用同一份 bytes，禁止验签两端各自重新 stringify。

请求 Header：

- `x-portal-key-id`；
- `x-portal-timestamp`，Unix seconds；
- `x-portal-nonce`，每请求 128-bit 随机值；
- `x-portal-body-sha256`；
- `x-portal-signature`；
- `apikey: <Supabase publishable key>`；不发送用户 JWT、service-role 或 Supabase secret key。

Edge Function 的第一段逻辑必须：

1. 只接受 POST 和受控 path；
2. 用 raw bytes 重算 body hash；
3. 按 keyId 选择 current/previous secret，使用 constant-time compare 验签；
4. 要求 timestamp 与服务器时间误差不超过 60 秒；
5. 用 `redisSetNxEx(<namespace>:replay:<keyId>:<nonce>, 1, 120)` 原子登记 nonce，拒绝重放；
6. 通过原子的 route budget / concurrency admission gate；只有拿到带 TTL 的 lease 才能继续；
7. 通过后才解析 JSON、调用 OpenAI/SageMaker 或数据库；失败统一返回 locator-free 401/403/429/503；
8. 在 `finally` 释放 concurrency lease，进程中断则由 TTL 回收；
9. 下游始终用 publishable key 调 Portal 公共 RPC，不使用现有 Hybrid 的 service-role fallback。

Redis 是签名入口的安全依赖，不是可跳过的缓存：nonce 登记、route budget 或 concurrency gate 任一存储不可用/超时，均 fail closed，且不得调用模型或数据库。对 Hybrid，BFF 收到 `guard_unavailable`、`budget_exhausted`、`concurrency_exhausted` 或 kill switch 状态后直接走 Database lexical fallback；对 LCIA wrapper 则显示暂不可用，不绕过签名入口。预算扣减与并发 lease 必须使用单个 Lua script 或等价原子事务，不能 read-then-write。

这证明“调用者持有 EdgeOne 部署密钥”，不声称 EdgeOne 平台提供 workload identity。若未来获得固定出口 CIDR、mTLS、OIDC 或私网连接，可作为第二因子，不能替代请求签名。

密钥无停机轮换顺序：

1. 在 Edge Function Secrets 中把 new 设为 current、old 设为 previous，并先部署验证端；
2. EdgeOne 新 deployment 把唯一的 `PORTAL_EDGE_KEY_ID` / `PORTAL_EDGE_HMAC_SECRET` 切到 new；
3. 观察 24 小时无 old 请求，同时保留回滚到上一 EdgeOne deployment 的能力；
4. 从 Edge Function Secrets 删除 previous，再次部署并验证；
5. Dev fixture 与 Main/Production 独立执行，禁止跨环境复用 keyId 或 secret；EdgeOne 只切换 Production current key。

若 EdgeOne 不能提供可验证、覆盖式的 client-address/origin trust contract，MVP 不信任客户端自报的 `X-Forwarded-For`：只使用 EdgeOne WAF、签名身份、全局/并发预算和可验证的平台 request metadata；per-visitor 限流继续作为上线前验证项。

入口必须：

- 只接受 Process/Flow 与 public catalog scope；
- 内部同时覆盖 100/200 并统一排序；
- 不接受 actor、team、state 或 SQL 字段名；
- 查询长度、数组长度、page size 和 filter 深度有上限；
- Redis 缓存规范化 query 与 embedding，键只使用 hash；
- 按签名 keyId、全局预算和经验证的 `visitorHash` 限流；
- 设成本预算、并发上限、熔断和 8 秒应用超时；
- 提供默认值为 `false` 的 `PORTAL_HYBRID_ENABLED` kill switch；关闭时不调用 rewrite/embedding/model；
- 超时、模型故障或限额触发时返回 lexical fallback 与明确状态；
- 日志仅记 query type/length/hash、阶段、时延、结果数和错误码，不记原始查询、embedding 或 UUID 列表；
- CORS 收敛到 Portal 域名，但不把 CORS 当作权限控制。

HMAC 只阻止未持有 secret 的客户端直接调用 Edge Function，不限制匿名用户通过公开 same-origin BFF 发起合法查询。因此成本边界由 EdgeOne WAF/BFF 请求预算、Edge Function 原子 admission gate、全局日/分钟预算、并发 lease、缓存、熔断与 kill switch 共同组成；任何文档、指标或 UI 都不得把 HMAC 描述成终端用户鉴权或单独的成本控制。

R2 Hybrid 的固定请求不接受 cursor、sort、state、actor、team、`data_source`、模型名、权重、阈值、embedding、visitor hash 或备注：

```ts
type PortalHybridSearchRequestV1 = {
  schemaVersion: "portal.hybrid-search-request.v1";
  kind: "process" | "flow";
  query: string; // 1–512 code points、UTF-8 <= 2048 bytes、无 C0/C1
  filters: {
    accessLevel?: "open" | "metadata_only";
    geography?: string;
    classification?: string;
    referenceYearFrom?: number;
    referenceYearTo?: number;
    processSubtype?: string;
    source?: string;
  };
  limit: number; // 1–20
};
```

Database R2 façade 固定为 `api.portal_hybrid_search_v1(p_kind, p_query_terms, p_query_embedding, p_filters, p_limit)`。它在 Database 内联合 lexical/semantic 的 100/200 Process/Flow candidates，使用版本化常量 `portal-hybrid-rank-v1` 做一次稳定融合，返回 `portal.public-hybrid-candidate-page.v1`；item 只复用 R1 public card/capability 字段。`match.evidence` 只能包含实际检索产生的 lexical rank、semantic rank 和 semantic distance，不能返回 raw `json`、`search_text`、embedding、team/model/owner/review 字段或猜测命中的具体字段。OpenAI rewrite 只能显示为 `source=model_generated`、`advisory=true` 的 query interpretation，不能当作数据库事实。

R2 最小版本不做 Hybrid cursor：一次最多返回 20 条，需要更多结果时进入现有 lexical GET 页。Edge 只返回 Hybrid 成功 DTO或固定失败原因；`guard_unavailable`、`budget_exhausted`、`concurrency_exhausted`、kill switch、circuit、timeout、contract failure 的 lexical fallback 由 Portal BFF 使用现有 R1 façade执行，Edge 不得在 guard 失败后绕过 guard 调 Database。Hybrid query 与备注不得进入 URL、浏览历史路径、telemetry 或默认 fragment。

### 10.4 Published LCIA

现有 `data_product_results`、service-only RPC、私有 Storage/S3 artifact 和 locator 响应保持不变，Portal 不调用这些入口。R1 新增 publication-bound、immutable、bounded、locator-free 数值投影：

- Worker/Release 在 public publication finalize 时把允许公开的 LCIA 数值和完整上下文写入 Database 私有 projection；
- Database 提供 exact `api.portal_get_published_lcia_values_v1(mode, process_refs, impact_category_id, cursor, limit)`，只返回当前/指定 publication 的白名单 DTO，并向 `anon`/`authenticated` 精确授权；
- `portal_data_product_results_v1` 使用 `portal-hmac-v1`，验签/guard 后只以 publishable key 调该 RPC；不得下载 artifact、接收 locator 或构造 service client；
- projection 与旧 artifact 同源且绑定 package/publication hash；发布验证必须证明行数、身份、方法、单位与 artifact evidence 一致。

Portal wrapper 支持：

- `process_all_impacts`；
- `processes_one_impact`；
- `ranked_processes_one_impact`。

Portal 只使用前两种展示详情与显式选中比较；不以公开排名代替可比性判断。

响应必须携带：Process ID/Version、impact ID/Name、LCIA Method ID/Version、规范化 decimal string、单位、功能单位、地理/精度、参考年、package/publication ID、发布时间和 evidence 状态。任何缺失值均为 unavailable，不得补 0。Edge 需要为 HMAC 入口补限流、缓存、上游超时和 locator-free 错误响应。

## 11. SEO 与渲染

### 11.1 HTML-first

- 首页、目录、详情元数据和公开 LCIA 摘要必须存在于初始 HTML；
- 每个 `/:locale` 初始响应的 `<html lang>` 必须等于已验证的路由 locale；不能依赖水合后脚本修正，也不能通过读取请求 header 把 SSG/ISR 全部转为动态渲染；
- 关闭 JavaScript 后仍能完成 identifier/lexical 搜索提交、翻页、详情阅读和 tab 跳转；Hybrid 明确不属于无 JS 基线；
- `generateMetadata` 读取同一 server query，生成 title、description、canonical、Open Graph 与 alternates；
- 每个公开版本输出 Schema.org `Dataset` JSON-LD；Database 目录输出 `DataCatalog`；
- JSON-LD 只声明真实存在的 license、creator、spatialCoverage、temporalCoverage 和 distribution。

### 11.2 索引控制

- 可索引：首页、受控 Browse 目录、Process/Flow 精确版本、方法论、扩展阶段的 Database；
- 不索引：任意 Search、Compare、Collections、Map 参数组合；
- Facet URL 使用 `noindex,follow`，避免 query × filter 的无限索引空间；
- zh-CN/en 互相声明 `hreflang`，根路径提供 `x-default`；
- 根级 `/catalog-{process|flow}-sitemap.xml` 各返回一个固定 64 项的 sitemap index；同一根级文件以唯一规范参数 `?shard={0..63}` 返回对应 XML shard，确保文件作用域覆盖 `/zh-CN/**` 与 `/en/**`；
- shard 数字只接受规范化 `0..63`，Portal 按 manifest 数组位置选择 opaque cursor 并原样调用 Database；cursor 不进入 URL、XML、响应或日志；
- sitemap 分片只包含当前公开且允许索引的 canonical URL；每个 shard 最多 4,096 个 identity，并为 zh-CN/en 各生成一条 reciprocal `<url>`，总计最多 8,192 URLs，最终 UTF-8 XML 必须严格小于 5 MiB；
- 最新版本进入 sitemap，历史版本由 Versions 页面发现；
- 成功响应默认 `no-store`，确保未验证的平台也满足零陈旧；只有 exact deployment 证明 cache key 精确包含规范 `shard` 参数、到期同步 revalidate、错误不缓存且不自动返回 stale 后，才设置 `PORTAL_SITEMAP_CACHE_MODE=shared-300` 并使用 `public, max-age=0, s-maxage=300, must-revalidate`；Vercel 的 `s-maxage` 会后台异步更新，因此当前禁止该模式；缺失参数表示 index，唯一参数只接受规范十进制 `0..63`，其他 query 全部在 Database 调用前返回 `404/no-store`；配置、上游、DTO 或字节门失败返回 `503/no-store`；禁止 query cache-bust、`stale-while-revalidate` 与 `stale-if-error`；
- robots 不用于保护数据，真正的权限仍在 Database/Edge。

### 11.3 缓存与新鲜度

安全状态与缓存所有权不能重叠：

| 层 | 只负责 | 明确不负责 |
| --- | --- | --- |
| 经验证的共享 CDN | hash 静态资源、构建产物，以及显式启用后的 sitemap XML | 不缓存 Search 或详情动态 HTML，不判断数据可见性；未证明同步 revalidate/no-stale 时不得缓存 sitemap |
| Next Route/Data Cache | 首页/目录 ISR、详情 DTO、Exchange 页和 LCIA 短缓存、request dedupe | 不缓存用户/团队数据、Hybrid 原文或 sitemap manifest/shard RPC |
| Edge Redis | HMAC nonce、route budget、concurrency lease，以及 Hybrid rewrite/embedding/公共结果的 hash-key 短缓存 | 不缓存页面 HTML、候选集或 Database 权限事实；不决定数据可见性 |

| 内容 | 策略 | 最大陈旧时间 |
| --- | --- | --- |
| 方法论、词表、静态导航 | 构建时生成 | 随部署更新 |
| 首页统计、受控目录 | ISR | 15 分钟 |
| exact-version visibility envelope | 每次 SSR `no-store` 或最长 60 秒 cache | 60 秒 |
| 精确版本详情与版本列表 DTO | Next Data Cache + tag | 5 分钟；visibility=false 时不得渲染 |
| Exchanges 分页 DTO | Next Data Cache + tag | 5 分钟；visibility=false 时不得渲染 |
| 当前公开 LCIA publication | 短 TTL/tag cache | 5 分钟 |
| Search 页面 | Next `no-store`；Edge 可对公共 hash query 短缓存 | 不跨用户状态 |
| sitemap | 显式 XML Route Handler；上游始终 `no-store`；响应默认 `no-store`，只有实测通过的平台启用唯一一层 300 秒共享缓存 | 默认 0；启用后最多 5 分钟 |

详情 HTML 为动态 SSR，先读取 visibility envelope，再使用可缓存 DTO。EdgeOne headers 必须阻止 CDN 把动态详情/Search HTML 缓存成长期对象。撤回和能力收紧在 60 秒 visibility SLA 内停止展示；LCIA publication 与 sitemap 在 5 分钟内更新。

MVP 使用 TTL；若以后引入受保护的 on-demand revalidation，它只失效 Next tag/CDN cache，不改变数据。部署自动清空 EdgeOne 静态 cache；数据发布不能依赖重新部署清 cache。Sitemap 的 route/data contract 保持平台中立，但缓存语义不是跨 CDN 等价：每个实际 CDN 都必须重新证明 300 秒、同步 revalidation、错误不缓存且不自动添加 stale 行为；证明前保持 `no-store`。

Cache key 必须包含 locale、kind、id、version、public capability、publication 和规范化 filter/cursor，不能跨版本、语言或权限范围污染。

## 12. 安全、隐私与滥用防护

### 12.1 最小权限

- 无 service role；
- 无用户 token、浏览器 token 或后台机器用户；仅 EdgeOne 后端与 Portal 专用 Supabase Edge Function 持有专用 HMAC secret；
- 无浏览器 Supabase client；
- raw core table 不作为匿名详情接口；
- 所有公开函数 `REVOKE FROM PUBLIC` 后按 exact signature grant；
- state 0/20、owner/team/review 数据通过 SQL 测试和远端匿名 probe 双重验证不可见；
- 任何 `SECURITY DEFINER` 函数都固定 search path、限制参数并经过 advisor/ACL 审计。

### 12.2 Web 安全

- CSP 默认拒绝，按实际字体、图片和后端域名放行，禁止 `unsafe-inline`；Next SHA-256 SRI 只覆盖外部资产，不能单独授权 App Router 内联 Flight scripts；全站 nonce 又会强制动态渲染并禁用 ISR；
- R0 非公开阶段只允许把严格候选策略置于 report-only 以收集证据，不得把 report-only 当作通过。主题 bootstrap 使用同源外部静态脚本；SRI、内联 Flight 处理、RSC hydration、Streaming 和 ISR 必须在 enforce 模式作为一个组合通过 exact EdgeOne main/Production deployment，无法同时满足即阻塞开启公开索引；
- `frame-ancestors 'none'`、`X-Content-Type-Options: nosniff`、`Referrer-Policy: strict-origin-when-cross-origin` 和最小 Permissions Policy；
- 用户内容只作为文本渲染，不用未经清洗的 HTML；
- URL/localStorage/JSON 导入全部经 Zod 校验；
- 外链标记目标域名和登录需求；
- 依赖 exact pin、锁文件提交、自动漏洞扫描和许可证检查。

### 12.3 隐私

- 不设置身份 Cookie；主题与语言只存在本地；
- 不把候选集、备注或排除理由发送到服务器；
- 统计默认只收集页面类型、性能、结果数和错误码；
- Hybrid 原始自然语言 body 不进入 access URL 或应用日志；GET lexical `q` 只受 EdgeOne 默认 24 小时 access-log 生命周期约束；
- EdgeOne 函数日志默认仅保留 24 小时，关键运维指标另做匿名聚合，不把日志当业务事实来源。

### 12.4 成本与可用性

- Identifier/lexical 搜索永远可独立工作；
- Hybrid 有独立限流、缓存、熔断和开关；
- 机器人流量优先读取 ISR 页面，不能无界触发 AI；
- EdgeOne WAF/Rate Limit 与 Edge Function Redis 限流同时使用；
- HMAC 不充当匿名访客限流；BFF 与 Edge 分别设置 route/global budget，Hybrid 再使用原子成本与并发 lease；
- nonce/admission Redis 不可用时 signed endpoint fail closed；Hybrid 由 BFF 回退 lexical，LCIA 显示暂不可用；
- LCIA 与 Exchanges 响应分页并限制大小，避免把完整库塞进单请求。

## 13. 视觉与组件系统

### 13.1 设计方向

视觉主题是“证据台账”：高信息密度、稳定坐标、细分隔线和精确数字排版。不是营销 SaaS、政府门户或聊天产品。

可识别的核心元素是“Evidence Rail”：结果行和详情字段左侧的一条四态证据轨，用位置、图标与文字区分 Original、Normalized、Derived、AI inferred。它编码真实 provenance，不作为装饰。

### 13.2 默认主色：与 `tiangong-lca-next` 一致

只对齐 `tiangong-lca-next/config/branding.ts` 当前两套主色，不复制 Ant Design 的完整 token 或算法：

| Theme | Portal `--brand-primary` / `--primary` 默认值 |
| ----- | --------------------------------------------- |
| Light | `#5C246A`                                     |
| Dark  | `#9E3FFD`                                     |

背景、surface、文字、muted、border、popover、sidebar、状态色和图表色使用 Portal 自身的 Radix + shadcn Nova + Tailwind v4 semantic CSS variables，并遵守以下原则：

- 使用 OKLCH 与 `@theme inline`；组件只消费 semantic token；
- Light/Dark 不做简单反相，各自保证层级、可读性和 Focus Ring；
- success、warning、danger、info 是独立语义色，不由品牌主色派生；
- 所有前景/背景组合满足 WCAG 2.2 AA；
- 不引入 Ant Design 依赖，也不追随其非主色 token 漂移。

默认 Logo 与 Next 同源：浅色 `/brand/logo.svg` 对应 Next `/logo.svg`，深色 `/brand/logo-dark.svg` 对应 Next `/logo_dark.svg`，favicon 对应 `/favicon.ico`。Portal 首次引入时复制 exact reviewed assets，并保存来源 repo、commit 与 SHA-256 receipt；运行时不依赖 sibling repo 路径。

### 13.3 可替换主色配置

品牌色是部署级配置，不是用户偏好或数据库数据。支持：

- `PORTAL_LIGHT_PRIMARY`，默认 `#5C246A`；
- `PORTAL_DARK_PRIMARY`，默认 `#9E3FFD`；
- `PORTAL_BRAND_VERSION`，用于 cache、视觉证据和回滚标识。

约束：

1. Zod 只接受规范化 `#RRGGBB`；非法配置使 build/boot fail closed；
2. 以浅/深 seed 在 OKLCH 中生成 50–950 primitive scale，并计算 primary/hover/active/subtle/foreground/ring/sidebar-primary；
3. success、warning、danger、info 使用 Portal UI 框架的独立语义色，不随主色变化；
4. `globals.css` 用 Tailwind v4 `@theme inline` 将 `--color-primary` 等映射到运行时 CSS variables；组件只使用 `bg-primary`、`text-primary-foreground`、`ring-ring` 等 semantic utilities；
5. Root Server Layout 输出已转义、已验证的 light/dark CSS variables；不拼接动态 Tailwind class；
6. 主题组合必须通过 WCAG 2.2 AA 对比度、focus ring 和 forced-colors 检查，否则部署失败；
7. 配置变化产生新 deployment，不允许运行中跨请求切品牌，避免 CDN/ISR cache 混色。

### 13.4 Logo 与 favicon 替换

支持部署变量：

- `PORTAL_LIGHT_LOGO`，默认 `/brand/logo.svg`；
- `PORTAL_DARK_LOGO`，默认 `/brand/logo-dark.svg`；
- `PORTAL_LOGO_MARK`，移动端/窄导航可选，默认复用当前主题 Logo；
- `PORTAL_FAVICON`，默认 `/brand/favicon.ico`；
- `PORTAL_LOGO_ALT_ZH` / `PORTAL_LOGO_ALT_EN`；
- `PORTAL_LOGO_WIDTH` / `PORTAL_LOGO_HEIGHT`，默认按源文件 `170.08 × 170.08` 比例。

规则：

- 首选同源 `/brand/**` 资产；允许远端时只接受 HTTPS 和 `PORTAL_BRAND_ASSET_ORIGIN` allowlist；
- SVG 以 `<img>`/`next/image` 外部资源方式呈现，不把未受信 SVG inline 注入 DOM；
- 必须声明 width/height 或 aspect ratio，避免 CLS；加载失败回退默认 Logo 与文本品牌名；
- Light/Dark/System 切换同步选择对应 Logo；在 `<html>` 水合前用最小内联主题脚本恢复 localStorage 偏好，System 模式使用 `prefers-color-scheme`，避免 Logo 与主题 hydration flash；
- Header、移动导航、favicon、manifest icons、Open Graph image/brand metadata 使用同一 `BrandConfig`；
- Alt 文本本地化；旁边已有可见品牌文字时纯图形 mark 使用 `alt=""`；
- Logo/主色替换不提供匿名上传或管理 API。通过 EdgeOne 环境变量或受审查的 `public/brand/**` 资产修改，重新部署后生效。

### 13.5 字体与密度

- 西文/数字：`Source Sans 3`；
- CJK：`Noto Sans SC` / `PingFang SC` / `Microsoft YaHei` 回退；
- UUID、版本、数值：`IBM Plex Mono`，启用 tabular numerals；
- 正文 14px 起，主要结果行触达高度不低于 44px；
- 8px 布局网格，6px 基础圆角，细边框优先于阴影；
- 字体从站点自身提供或使用可靠系统回退，不依赖运行时访问 Google Fonts。

### 13.6 shadcn/ui

目标基线为 Radix primitives + Nova 风格。实现时先用当前 shadcn CLI 获取项目 context，再从官方 `@shadcn` registry 选择组件；不未经选择引入第三方 registry。

优先组合：

- InputGroup、Command、Dialog：统一搜索和命令面板；
- Sidebar/Sheet、Accordion、Checkbox：分面；
- Table、Card、Badge、Tooltip、HoverCard：结果与详情；
- Tabs 只用于局部状态，详情主内容使用路由；
- Resizable、ScrollArea：三栏桌面布局；
- Empty、Alert、Skeleton、Spinner、Sonner：空态、错误和反馈；
- ToggleGroup：密度、主题和比较视图切换。

规则：

- `className` 只做布局，颜色/字体通过 semantic token 与 variant；
- 不写 raw `dark:` 颜色覆盖；
- 不用 `space-x/y`，使用 flex/grid + gap；
- Dialog/Sheet/Drawer 必须有可访问 Title；
- Badge、Empty、Alert、Skeleton、Separator 使用官方组件，不手搓同类 markup；
- 业务组件组合 shadcn primitives，`components/ui` 保持可追踪上游差异。

## 14. 无障碍、国际化与响应式

### 14.1 无障碍

基线升级为 WCAG 2.2 AA：

- 状态不只靠颜色；
- 全站键盘可达、焦点清晰、顺序稳定；
- 200% zoom 不丢内容或操作；
- 触控目标满足 WCAG 2.2；
- 尊重 `prefers-reduced-motion`；
- 快捷键在 input、textarea、select、contenteditable 和组合控件中禁用；
- 表格有 caption、行列 header 和可理解的排序状态；
- 图表提供精确数据表，地图提供等价可筛选列表；
- Field origin 标记有文字、图标、`aria-label` 和解释。

### 14.2 国际化

- 首发 `zh-CN` 与 `en`；
- 使用 `next-intl` 的 locale segment 与 Server Component 消息加载；
- 日期、数字、单位和复数规则本地化；
- UI 语言与数据内容语言分离；
- 数据字段回退到其他语言时明确标记来源，不伪装成本地化原文；
- 切换语言保留同一对象、版本、查询和分面。

### 14.3 响应式

- `>=1280px`：三栏完整工作区；
- `768–1279px`：分面 Sheet + 收起托盘；
- `<768px`：单列、比较最多 2 条、以查询和阅读为主；
- 地图移动端默认表格视图；
- 高密度表格在窄屏改为定义列表，不横向压缩关键信息。

## 15. 技术栈与依赖政策

### 15.1 当前验证基线

下表是方案形成时已通过官方文档或 npm registry 核对的稳定基线。真正 scaffold 前重新查询一次；确认兼容后全部 exact pin，不在 `package.json` 使用范围符号。

| 层                 | 基线                                   |
| ------------------ | -------------------------------------- |
| Node build         | `24.18.0`                              |
| package manager    | `pnpm 11.24.0`                         |
| Next.js            | `16.3.3`                               |
| React / React DOM  | `19.2.8`                               |
| TypeScript         | `7.0.2`                                |
| Tailwind CSS       | `4.3.3`                                |
| shadcn CLI         | 当前稳定 `4.19.0`，生成的源码进入仓库  |
| i18n               | `next-intl 4.13.7`                     |
| runtime validation | `zod 4.4.3`                            |
| unit test          | `Vitest 4.1.11` + Testing Library      |
| browser test       | `Playwright 1.62.1`                    |
| formatting/lint    | Prettier + Oxlint，沿用 workspace 约定 |

MVP 不引入重量级状态管理、客户端查询缓存、Chart 或 Map 依赖。Server Components、URL、React state 与 localStorage 已覆盖主要需求；LCIA 图形先用可访问的轻量 SVG/CSS，地图依赖留到扩展阶段。

### 15.2 Next 配置

- App Router；
- `app/[locale]/layout.tsx` 是本地化页面的动态根布局，并通过 `generateStaticParams` 保留 zh-CN/en 静态生成；根跳转、R0 probe 与全局 404 使用独立 root document，共享同一个主题/品牌 bootstrap；
- 不使用 `output: "export"`；
- EdgeOne 输出目录 `.next`；
- 静态与 ISR 路由启用 `experimental.sri.algorithm="sha256"`，并由 exact EdgeOne main/Production deployment 证明平台对该 experimental 能力兼容；
- 多 root layout 的 unmatched URL 使用 Next `experimental.globalNotFound` 输出完整、带语言和 `noindex` 的 404 document；该 experimental 能力与 SRI 一并进入 R0 compatibility gate；
- TypeScript 7 使用 Next 16 默认 TypeScript CLI 路径，并在 compatibility spike 验证；不为默认已启用的行为保留冗余 experimental 配置；
- `next-env.d.ts` 由 `next dev/build/typegen` 生成并纳入 `tsconfig`，但不提交到 Git；
- 不依赖 Next config redirects/rewrites，跨路径规则使用当前 EdgeOne-compatible `middleware.ts` 或 `edgeone.json`；EdgeOne adapter 支持 Node proxy 后再恢复 `proxy.ts`；
- 图片使用 `next/image`，仅配置必要远端域名；
- `next typegen && tsc --noEmit` 是独立 typecheck；
- Client boundary 通过 lint 和 bundle 检查防止 server-only 模块泄漏。

## 16. 建议目录结构

```text
tiangong-lca-portal/
├── AGENTS.md
├── .docpact/config.yaml
├── edgeone.json
├── next.config.ts
├── package.json
├── pnpm-lock.yaml
├── public/
│   ├── fonts/
│   └── brand/
├── src/
│   ├── proxy.ts
│   ├── app/
│   │   ├── [locale]/
│   │   │   ├── page.tsx
│   │   │   ├── search/
│   │   │   ├── process/[ref]/
│   │   │   ├── flow/[ref]/
│   │   │   ├── compare/
│   │   │   ├── collections/
│   │   │   ├── browse/[dimension]/
│   │   │   └── methodology/
│   │   ├── internal/
│   │   │   ├── hybrid/
│   │   │   └── lcia/
│   │   ├── robots.ts
│   │   └── sitemap.ts
│   ├── components/
│   │   ├── ui/
│   │   ├── brand/
│   │   └── domain/
│   ├── config/
│   │   └── brand.ts
│   ├── features/
│   │   ├── catalog/
│   │   ├── collections/
│   │   └── compare/
│   ├── server/
│   │   ├── contracts/
│   │   ├── data/
│   │   ├── search/
│   │   ├── hybrid/
│   │   └── lcia/
│   ├── i18n/
│   └── lib/
├── scripts/
│   └── validate-brand-config.mjs
├── tests/
│   ├── unit/
│   ├── contract/
│   ├── integration/
│   └── e2e/
└── docs/
    └── design-plan.md
```

依赖方向固定为：`app/features -> server domain -> transport adapters`。业务组件不直接构造 Supabase URL，不直接解析数据库 raw row。

## 17. EdgeOne Makers 部署

### 17.1 发布模型

- 使用 EdgeOne Makers Git integration 作为唯一发布者；
- Production 绑定 Portal `main`；
- feature/PR 只运行 GitHub/local gates，不创建独立 EdgeOne Preview；
- 每个 PR 合并到 `main` 后自动部署到 `portal.tiangong.earth`，该 Production 域名同时承担 hosted TDD 与最终发布；
- TDD 阶段固定 `PORTAL_PUBLIC_INDEXING=disabled`，所有门通过后才以新 deployment 开启索引；
- GitHub Actions 只做 lint、typecheck、test、build 和安全检查，不再次部署；
- 每次部署使用不可变 commit SHA，回滚到上一成功 deployment；
- EdgeOne 只持有 Production 环境变量并只调用 Supabase Main；本地/CI fixture 与 Main 凭据仍严格分离。

### 17.2 构建配置

目标 `edgeone.json`：

```json
{
  "installCommand": "pnpm install --frozen-lockfile",
  "buildCommand": "pnpm build",
  "outputDirectory": ".next",
  "nodeVersion": "24.18.0",
  "cloudFunctions": {
    "maxDuration": 30,
    "regions": {
      "overseas": ["na-ashburn"]
    }
  }
}
```

`na-ashburn` 与当前 Supabase/Edge 的 US East 入口接近，是初始候选。是否增加中国大陆 region 必须依据 ICP、目标域名和实测后决定；不能仅凭用户所在地猜测。

EdgeOne 只配置 Production 环境变量：

| 类别 | 变量 |
| --- | --- |
| HMAC signer | `PORTAL_EDGE_KEY_ID`、`PORTAL_EDGE_HMAC_SECRET` |
| 公共数据 | `SUPABASE_URL`、`SUPABASE_PUBLISHABLE_KEY`、`SITE_URL` |
| Sitemap cache | `PORTAL_SITEMAP_CACHE_MODE=no-store`；仅在该平台通过 no-stale 验收后改为 `shared-300` |
| 主色 | `PORTAL_LIGHT_PRIMARY`、`PORTAL_DARK_PRIMARY`、`PORTAL_BRAND_VERSION` |
| Logo | `PORTAL_LIGHT_LOGO`、`PORTAL_DARK_LOGO`、`PORTAL_LOGO_MARK`、`PORTAL_FAVICON` |
| Logo metadata | `PORTAL_LOGO_ALT_ZH/EN`、`PORTAL_LOGO_WIDTH/HEIGHT`、可选 `PORTAL_BRAND_ASSET_ORIGIN` |

Supabase Edge Function 配置按项目分别保存；当前批准的例外仅共享底层 Upstash endpoint/token。EdgeOne Production 只调用 Supabase Main；本地/CI 使用 loopback fixture 或 persistent Dev 的独立凭据。用户批准不创建单独 EdgeOne Preview，R0 hosted probes 在 Production 域名、索引关闭状态下验证真实 Main signer/namespace，不部署可调用业务内核的临时替代凭据：

| 类别 | Edge Function 配置 |
| --- | --- |
| HMAC verifier | `PORTAL_HMAC_KEY_ID_CURRENT`、`PORTAL_HMAC_SECRET_CURRENT`；轮换期可选 `PORTAL_HMAC_KEY_ID_PREVIOUS`、`PORTAL_HMAC_SECRET_PREVIOUS` |
| Redis provider | `PORTAL_REDIS_CLIENT_TYPE=upstash`、`PORTAL_UPSTASH_REDIS_URL`、`PORTAL_UPSTASH_REDIS_TOKEN` |
| Redis guard | Dev：`PORTAL_REDIS_NAMESPACE=portal:dev:v1`；Main/Production：`PORTAL_REDIS_NAMESPACE=portal:main:v1`；`PORTAL_REDIS_TIMEOUT_MS=500` |
| R0 fixture | 独立 `PORTAL_R0_*` HMAC/publishable/Redis surface，`PORTAL_R0_REDIS_NAMESPACE=portal:r0:<fixture>:v1` |
| Hybrid gate | `PORTAL_HYBRID_ENABLED=false`，仅在 R2 gate 全绿的目标环境显式设为 `true` |

Dev 使用 `portal:dev:v1`，Main/Production 使用 `portal:main:v1`；两者当前可以保存相同的 `PORTAL_UPSTASH_REDIS_URL/TOKEN`，但不得保存相同的 namespace 或 HMAC keyId/secret。共享 token 不证明 Dev/Main 安全隔离，部署证据只能声明 Supabase target、HMAC identity、namespace 和应用 key construction 隔离，并必须同时记录共享配额、故障域和轮换域风险。

HMAC 与 Redis 凭据是秘密，永不渲染；previous HMAC key 只存在于 Supabase Edge Function Secrets 的轮换窗口，不配置到 EdgeOne signer。品牌变量本质上是公共展示配置，经过校验后进入 HTML/CSS metadata。由于 EdgeOne 单变量值上限为 500 bytes，品牌配置使用独立变量，不使用大段 JSON。变量变化只对新 deployment 生效，因此每次换色/Logo 都生成可回滚的部署记录。

### 17.3 平台约束

EdgeOne 当前官方支持 Next.js 13.5+、14、15、16，以及 App Router、SSR、ISR、RSC、Streaming、Middleware、Route Handlers 和 Image Optimization。实际 deployment `dp4k6q62p30g` 使用 `@edgeone/opennextjs-pages`：Next 16 Node `proxy.ts` 构建成功但运行时对所有 matched path 返回 `Middleware execution failed: a is not a function`。Portal 因此使用 Next 仍支持的 legacy `middleware.ts` Edge runtime，并同时导出 named/default handler；只有 exact EdgeOne deployment 证明 native Node proxy 可用后才恢复 `proxy.ts`。

Compatibility spike 必须实测：

- Node 24 + pnpm 11 build；
- Next 16 + React 19 + TypeScript 7 typecheck/build；
- RSC、SSR、ISR、Streaming、legacy `middleware.ts`/future `proxy.ts`、Route Handler、Image Optimization；
- 严格 CSP 下的 SRI、RSC hydration、Streaming 与 ISR 组合；不得用全站 nonce 让页面静态性测试失真；
- 实际 SSR `process.version`；当前日志为 Nodejs20.19，继续使用 native fetch 且不得引入要求 Node 22+ 的服务端 SDK；
- 使用独立 `PORTAL_R0_*` HMAC/publishable 凭据和 `portal:r0:<random-fixture>:v1` 可丢弃 namespace；按 §10.3 的共享存储决策映射同一 Upstash endpoint/token，验证 EdgeOne Web Crypto HMAC、Supabase Deno 验签、`SET NX EX`/Lua 原子能力、nonce 防重放、current/previous key 轮换与 exact-key cleanup；fixture 不接业务 RPC/模型、不读取 Dev/Main HMAC 或 namespace，保存证据后删除 exact fixture keys 与 R0 project 的临时 secret copies，禁止删除共享 database 或绕过协调单独轮换共享源 token；
- 除 §10.3 明确共享的 Upstash endpoint/token 外，Dev/Main 的 Supabase target、HMAC、publishable key 和 namespace 隔离；EdgeOne deployment 必须拒绝 Dev target；
- 默认浅/深主色与 `tiangong-lca-next` 对齐；Portal 其余 semantic token、自定义主色和替换 Logo 的 Production smoke；
- `edgeone.json` headers、404、缓存与 canonical domain；扩展 tombstone 另测 410；
- 回滚、冷启动和跨区域数据库时延。

平台限制纳入验收：Cloud Function 包不超过 128 MB，请求/响应 body 不超过 6 MB，默认 30 秒、最多 120 秒。Portal 自身设更小预算：详情响应目标不超过 512 KB，sitemap XML 严格小于 5 MiB，Hybrid 8 秒超时，不通过提高平台上限掩盖慢查询。

## 18. 性能、可靠性与可观测性

### 18.1 用户性能预算

- Core Web Vitals p75：LCP <= 2.5s、INP <= 200ms、CLS <= 0.1；
- 缓存详情 TTFB p75 <= 800ms；
- Identifier/lexical 搜索 p95 <= 2s；
- Hybrid 搜索 p95 <= 6s，8s 后回退；
- 首页首屏 JavaScript gzip <= 120 KB；
- 详情页首屏 JavaScript gzip <= 180 KB；
- 搜索页首屏 JavaScript gzip <= 250 KB；
- 不为隐藏 tab 预加载大型表格、地图或图表。

### 18.2 数据查询

- 详情一次读取主 envelope，关联数据批量加载，禁止 N+1；
- Exchanges、版本和搜索使用 cursor；
- 常用公开状态使用与 predicate 匹配的 partial/composite/covering index，但必须由真实 EXPLAIN 证明；
- Hybrid 与 facet 分开预算，慢 facet 不阻塞首批结果；
- Edge 与 Next 同时记录 correlation ID，但不记录原始 query。

### 18.3 可观测性

结构化事件：route family、query kind、locale、cache hit/miss、backend、latency、row count、fallback、status/error code、deployment SHA。

不记录：原始自然语言、完整 UUID 列表、候选集、用户备注、embedding、Supabase key 或内部 locator。

Dashboard 至少覆盖：

- 5xx、404、backend timeout；启用 tombstone 后再加入 410 指标；
- lexical/hybrid 成功率与 fallback 率；
- HMAC reject reason、nonce replay、guard unavailable、budget/concurrency reject、kill switch 和 lease 回收；
- LCIA publication 可用率；
- cache hit ratio；
- 搜索零结果率；
- Core Web Vitals；
- EdgeOne 函数调用、时延和限额。

## 19. 测试与质量门

### 19.1 单元与契约测试

- URL、fragment、localStorage schema 和迁移；
- `uuid@version`、CAS、分类码和自然语言识别；
- DTO Zod 校验和错误收敛；
- access capability 与显示逻辑；
- 引用与可比性纯函数；
- HMAC canonicalization、body hash、constant-time verify、clock window 和 key rotation fixture；
- Upstash/Standard Redis adapter 的 `SET NX EX`、Lua admission、namespace、超时、配置缺失和错误响应 fixture；
- BrandConfig Zod、默认 `tiangong-lca-next` 主色 snapshot、Portal semantic token、OKLCH 派生、对比度、Logo URL/尺寸/alt fallback；
- exact Database Portal Schema/generated-type snapshot 的闭合 inventory、source commit、bytes/SHA-256 与可选上游 Git byte comparison；
- i18n key 完整性；
- Server/Client import 边界。

### 19.2 Database/Edge 集成测试

以 anon 身份验证：

- 100/200 代表行可搜索、可读允许字段；
- 0/20、owner/team/review 行不可读；
- 伪造 state、actor、team 和 datasource 参数无效；
- 200 的未授权数值字段被剥离；
- exact version、历史版本与撤回 404 正确；扩展 tombstone 启用后单独验证 410；
- search/facet cursor 稳定且没有重复/漏项；
- Hybrid valid signature、tampered body、expired timestamp、duplicate nonce、unknown keyId、old/new rotation、限流、缓存、超时和 lexical fallback；
- Edge deploy-script contract 与远端 auth probe 证明两个 Portal 函数均关闭网关 JWT 校验，并在任何 JSON、AI 或数据库路径前执行 HMAC verifier；
- LCIA/Hybrid 在 Redis outage 时均不进入数据库/模型；Hybrid 的原子预算并发竞争、预算耗尽、lease TTL 回收和 kill switch 均不产生模型调用并触发预期 fallback；
- Supabase Dev/Main 按 §10.3 共享已批准的 Upstash endpoint/token，但必须使用 `portal:dev:v1` 与 `portal:main:v1`、不同 HMAC keyring 和不同 Supabase project；测试证明 runtime 只生成当前 target prefix、拒绝错误 namespace、不会回退通用 Redis 凭据，并明确不能把 namespace 描述成 Redis 权限隔离；
- Portal 专用 Supabase Edge Function 下游使用 publishable/anon RPC，测试中禁止构造 service-role client；
- LCIA 有值时包含单位、方法、Process 版本和 publication；
- LCIA 缺失时不产生 0。

### 19.3 浏览器与 SEO

- Playwright 覆盖 zh-CN/en、浅/深主题、三种断点；
- zh-CN/en 的原始初始响应与水合后 DOM 都具有 exact `<html lang>`；本地化 404 与全局 404 返回真实 `404`、有效 document language 和产品错误界面；
- 默认浅/深主色与 `tiangong-lca-next` snapshot 一致；其余 Portal semantic token、自定义主色、Light/Dark Logo、favicon、manifest/OG metadata 和失败 fallback 的视觉回归通过；
- 无 cookie、无登录完成搜索→详情→比较→引用；
- JavaScript 关闭后核心页面可读；
- axe 无 serious/critical；
- 纯键盘、屏幕阅读器、200% zoom、reduced motion 人工走查；
- canonical、hreflang、JSON-LD、robots、64-way sitemap index/shard、XML 解析、5 MiB 门、300 秒 cache 与 404/503 no-store；
- Search/Compare/Collections 不被索引；
- 浏览器 bundle 和 sourcemap 不含 secret/service role；
- CSP 不含 `unsafe-inline`，主题 bootstrap script 的构建时 SHA-256 hash 与实际响应字节一致；
- Exact EdgeOne main/Production deployment 完成 SSR/RSC/ISR/Runtime smoke。

### 19.4 发布门

```text
format/lint
→ typecheck
→ unit/contract
→ integration anon-security
→ build
→ Playwright + accessibility + SEO
→ EdgeOne main/Production smoke（索引关闭）
→ manual product review
→ Production
```

## 20. 分期与跨仓交付

### 20.1 可发布版本矩阵

| Release | 对外状态 | 功能范围 | 硬依赖 | Go/no-go gate |
| --- | --- | --- | --- | --- |
| R0 Bootstrap | 不公开 | 独立仓库、治理、最小 App、EdgeOne compatibility | Portal 首个 main、workspace onboarding | §17.3 全部 compatibility 项有 exact deployment SHA、runtime 输出、官方文档 URL 与 pass 证据 |
| R1 Public Catalog MVP | 首次公开 | lexical/identifier search、Process/Flow 详情、Versions、Exchanges、公开 LCIA、Citation、2–4 条确定性比较、本地候选集/JSON、品牌配置、SEO/i18n/a11y | Database public catalog + LCIA numeric projection、Worker/Release publication write、HMAC verifier + signed LCIA wrapper、R0 | §23.5 R1 checklist 每项通过；不依赖 Hybrid |
| R2 Intelligent Discovery | 增量公开 | HMAC-signed Hybrid、query interpretation、evidence-backed reasons、可选 Process Group、显式 Hybrid-query/含备注 fragment 分享 | Database public Hybrid façade、Portal/Edge Phase 3 promoted main、HMAC/admission contract | §23.6 R2 checklist 每项通过；Hybrid 故障或 guard 拒绝自动回退 lexical |
| R3 Catalog Expansion | 分项公开 | Database/Data Package、LCIA Method、Relationships、Map、经批准的 Redis 短链 | 每项独立上游 identity/provenance/privacy contract | 每个能力单独 tracked Issue 和验收，不整包放行 |

§23 是完整目标验收；R1 使用 §23.5，R2 使用 §23.6。R2/R3 不能用尚未实现的增强项阻塞 R1，也不能反向放松 R1 的匿名安全、SEO 或可比性门。

### 20.2 Phase 0：治理与兼容性

1. 初始化 Portal 独立仓库与 `main`；
2. 建立 `AGENTS.md`、Docpact、CI 和依赖政策；
3. 完成 EdgeOne Next SSR compatibility spike；
4. 把 Portal 作为 M1 子模块纳入 workspace。

退出条件：远端有可引用 main SHA；§17.3 列出的 RSC、SSR、ISR、Streaming、Middleware/Proxy、Route Handler、Image、状态/缓存、回滚、runtime 与 Dev/Main 凭据隔离全部在一个 exact EdgeOne main deployment 通过并保存证据；root 治理与 delivery profile 可路由 Portal。Production HMAC probe 必须验证真实 signer/verifier/keyring/Redis guard。任一项未验证都保持索引关闭，而不是留给公开流量发现。

### 20.3 Phase 1：Database 公共读契约

1. exact detail / versions / exchange page / list / search / facets / fixed 64-way sitemap manifest/shard façade；
2. 许可到 capability 的版本化 fail-closed policy；未知/矛盾许可保持 metadata-only；
3. publication-bound LCIA decimal projection 与 `portal_get_published_lcia_values_v1`；
4. cursor、ACL/RLS、索引和 anon SQL tests；
5. 固化 exhaustive JSON Schema、生成类型与契约 fixture。

退出条件：匿名读取闭包完整，0/20 不可见，Portal 不再需要 raw table。

### 20.4 Phase 2：Portal 基础闭环

1. App Router、i18n、主题与设计系统；
2. 首页、lexical/identifier search、Process/Flow 详情；
3. Versions、Exchanges、Citation、Methodology；
4. SEO、sitemap、缓存与 404；
5. Portal 实现 same-origin BFF signer：固定 canonicalization、server-only secret、超时与错误收敛；
6. Edge 实现 verifier/keyring、nonce 与原子 route admission guard，以及已发布 LCIA signed wrapper；
7. 已发布 LCIA 详情；
8. 2–4 条确定性比较；
9. 默认 `tiangong-lca-next` 浅/深主色、可替换主色、Logo 与 favicon；
10. 本地候选集、JSON 导入导出和默认不含备注的 fragment 分享。

退出条件：不登录完成发现→理解→比较→引用/本地整理；核心内容在初始 HTML；满足 R1 gate。

### 20.5 Phase 3：HMAC-signed Hybrid 与解释增强

1. Database 新增 Portal public Hybrid façade：固定联合 100/200、版本化融合排序、public card hydration、严格 DTO/evidence 与 anon tests；
2. Portal 增加 Hybrid BFF adapter，复用 signer，并把 guard/预算/熔断失败收敛为 lexical fallback；
3. Edge 复用 verifier，为 Hybrid 增加专用入口、原子成本/并发 admission、缓存、熔断和 kill switch；
4. Query interpretation 与 evidence-backed match reasons；
5. 将 Hybrid evidence 接入既有比较与空结果放松建议；
6. 上游提供完整依据时启用 Process Group；
7. 加入带内容预览与二次确认的 Hybrid-query/含备注 fragment 分享。

退出条件：Hybrid 故障不影响 lexical；无有效 HMAC、Redis guard 不可用、预算/并发耗尽或 kill switch 关闭时均不产生模型调用；比较不在不可比时并列数值；私人备注不离开浏览器；满足 R2 gate。

### 20.6 Phase 4：扩展浏览

- Database/Data Package；
- LCIA Method；
- 受控 Process Group；
- Relationship graph；
- Map 与等价表格；
- 经批准后的 Redis 短链。

每项必须先有真实上游 identity/field/provenance contract。

## 21. Tracked work ownership

| Work package | Owner repo | 分支/PR 目标 | 主要产物 |
| --- | --- | --- | --- |
| Portal governance + R0 compatibility | `tiangong-lca-portal` | M1：PR to `main` | 仓库治理、EdgeOne main/Production hosted probes、exact deployment evidence |
| Public read façade + capability policy | `database-engine` | M2：feature from `dev`, PR to `dev`, promote to `main` | RPC、许可/capability policy、ACL、RLS、索引、tests、types |
| Public LCIA numeric projection | `database-engine` | M2：feature from `dev`, PR to `dev`, promote to `main` | immutable projection、locator-free RPC、publication/evidence tests |
| LCIA projection materialization | `tiangong-lca-worker` | M1：PR to `main` | publish payload/value/context materialization 与 idempotence proof |
| LCIA projection finalize | `tiangong-lca-release` | M1：PR to `main` | publication-bound finalize/verification、hash/count reconciliation |
| Portal R1 product + HMAC signer | `tiangong-lca-portal` | M1：PR to `main` | App Router 闭环、same-origin BFF signer、部署级品牌配置 |
| Edge R1 verifier + LCIA | `tiangong-lca-edge-functions` | M2：feature from `dev`, PR to `dev`, promote to `main` | verifier、keyring、Upstash/Standard Redis 原子 guard adapter、deploy/auth probe、signed LCIA、限流 |
| Database R2 public Hybrid façade | `database-engine` | M2：feature from `dev`, PR to `dev`, promote to `main` | 联合 100/200 candidates、固定融合排序、public hydration、严格 DTO/evidence、anon tests |
| Portal R2 Hybrid adapter/UI | `tiangong-lca-portal` | M1：PR to `main` | Hybrid BFF adapter、lexical fallback、解释与分享 UI |
| Edge R2 Hybrid runtime | `tiangong-lca-edge-functions` | M2：feature from `dev`, PR to `dev`, promote to `main` | signed Hybrid、原子预算/并发、缓存、熔断、kill switch、fallback |
| Workspace integration | `lca-workspace` | M3：PR to `main` | 各 release 所需 exact main SHA 与跨仓验证 |

`tiangong-lca-next` 默认不需要改动；只有确认要抽取共享公共 DTO/package 时才单独立项，不能从 Portal 任务顺手修改。

Workspace coordination `tiangong-lca/workspace#739` 维护整体路线；每个表中 work package 仍须建立 owner repo executable Issue。R1 Edge verifier/LCIA 与 R2 Edge Hybrid 不合并成一个 Issue 或发布门。子仓 PR merge 只代表 repo-complete；只有当前 release 所需 M2 产物进入 `main`、对应 Portal `main` 完成并由 root 精确 gitlink 集成后，该 release 才 delivery-complete。

Portal 已在 workspace delivery profile 中注册为 `portal`，所有新工作均使用正常的 `Project -> Issue -> PR -> Integration` 流程；当前不存在 bootstrap 提交例外。Portal 仓库只承载 Portal-owned implementation，root 只承载 workspace governance 与精确 gitlink integration。

## 22. Portal 仓库与 workspace integration

### 22.1 当前状态

- canonical repository 为 `tiangong-lca/portal`，可写 `main` 是唯一长期分支；routine branch 从 `origin/main` 创建并 PR 回 `main`；
- workspace 已用 HTTPS URL 把 Portal 注册为 `tiangong-lca-portal` mode-160000 submodule，并在 delivery profile、Docpact catalog/ownership/routing、branch matrix、repository map 与 graph 中注册 `portal`；
- live Project 已有 `Repo Tag=portal`，Portal executable work 由 workspace controller 创建、启动、提交和完成；
- Portal 使用 `layout: repo` 的 repository-owned Docpact config；root Docpact 只拥有跨仓路由和 gitlink integration；
- root gitlink 是经过审查的集成输入，不自动跟随 child `main`。每个需要 root integration 的 release 都必须单独 pin exact eligible child SHA；
- onboarding 完成只证明仓库和交付链可用，不证明 R0、R1 或 EdgeOne Production release readiness。

### 22.2 正常交付顺序

1. 通过 `<workspace-root>/scripts/workspace-ops task create --repo portal --title <title> --body-file <file>` 创建 executable Issue，并按返回命令 start；
2. 从 canonical `origin/main` 建立独立 task branch/worktree；
3. 用 `<workspace-root>/scripts/docpact route --root <portal-root> --paths <paths>` 读取直接治理文档；
4. 在 Portal owner boundary 内实现并以小提交保存；Database、Edge、Release 和 root 变更进入各自仓库与 Issue；
5. 运行 Portal repository gates 与 Docpact after-coding lint，推送并由 controller submit PR；
6. PR 通过 CI/独立 review 后合入 Portal `main`，完成 repository-level delivery；
7. 若 Issue 要求 workspace integration，另由 root task pin exact eligible Portal `main` SHA，并在 root PR 合并后用 controller finish；
8. R0/R1/R2 只有对应 checklist 和所有 required owner/main/integration 记录完整时才 release-complete。

### 22.3 Docpact contract

- Active layout：`repo`；Portal 是单一 governed unit；
- Portal config 拥有 product/runtime/governance/proof 路由，root config 拥有跨仓和 exact gitlink 路由；
- 不使用 baseline 或 waiver 隐藏当前 findings；若出现 drift，按具体 diagnostic 修正文档、规则或实现；
- 每次变更先 route，完成后运行 strict validation、doctor/coverage（治理改动时）与 merge-base lint；
- review metadata 必须引用实际审阅的祖先提交，不引用自身 metadata-only commit。

当前验证命令：

```bash
scripts/docpact validate-config --root /Users/davidli/projects/workspace/tiangong-lca-portal --strict --format json
scripts/docpact list-rules --root /Users/davidli/projects/workspace/tiangong-lca-portal --format json
scripts/docpact coverage --root /Users/davidli/projects/workspace/tiangong-lca-portal --format json
```

## 23. 最终验收

### 23.1 产品

- 匿名、无 Cookie 完成搜索、详情、公开 LCIA、比较、引用和本地整理；
- 全站没有登录墙、API 页面、MCP/Skill 示例或伪装的高级功能；
- 每类数值满足 §10.2 的独立上下文矩阵；Exchange 不伪造 LCIA publication，LCIA 不缺方法/地理/时间/publication；
- Process Group、字段来源、匹配理由和代理只展示上游 evidence；
- Metadata-only 不出现空白数值表或误导性 0。

### 23.2 权限

- 100/200 的允许元数据匿名可见；
- capability 允许的公开 Exchanges/LCIA 匿名可见；
- 0/20、私有、团队和审核数据从所有入口不可见；
- 伪造 filter/state/actor/team 无法扩大范围；
- HMAC 缺失、错误、篡改、过期、重放或未知 keyId 均在 JSON/AI/数据库业务逻辑前拒绝；Dev/Main 的 HMAC、Supabase target、publishable key 和 namespace 隔离及 Production current/previous 轮换通过；§10.3 共享的 Upstash endpoint/token 不得被描述为 Redis 权限隔离；
- 浏览器、部署产物、日志和错误响应无 service role、secret 或 locator。

### 23.3 SEO

- 首页、目录、详情与公开 LCIA 的重要内容在初始 HTML；
- zh-CN/en 的初始 `<html lang>` 与路由一致，未知 URL 的 404 document 具有有效语言且保持 `noindex`；
- 每个详情页有唯一 canonical、hreflang、结构化数据和正确状态码；
- 两个 catalog sitemap index 各固定列出 64 个数字 shard；分片仅含允许索引的最新公开对象，128 个公开 shard 的 union 无重复或遗漏；
- sitemap 上游 RPC 始终 `no-store`，成功 XML 严格小于 5 MiB；响应默认 `no-store`，只有托管平台通过同步 300 秒/no-stale 验收才启用唯一一层共享 CDN cache；404/503 不缓存；
- Search/Compare/Collections 不进入索引；
- 撤回/能力收紧在 60 秒 visibility SLA 内停止展示；publication 与 sitemap 在 5 分钟内更新。

### 23.4 工程

- Exact EdgeOne main/Production deployment 验证 Next 16、React 19、TypeScript 7、SSR/RSC/ISR/Streaming；
- 依赖 exact pin，pnpm lockfile 可复现；
- 所有 Server-only 模块不进入浏览器 bundle；
- 默认浅/深主色、派生 semantic token、自定义主色、Logo/favicon 替换及失败回退均通过自动与视觉回归；
- 测试、性能、无障碍和安全门全部通过；
- Database、Edge、Portal 与 root 的 owner/branch/integration 记录完整。

### 23.5 R1 Public Catalog MVP release checklist

以下每项都是 required；没有“与 R1 相关项”之类的解释空间：

1. R0 的完整 EdgeOne compatibility matrix 已绑定 exact `portal/main` Production deployment 并全绿；
2. Database public catalog/capability/LCIA projection 已 promote 到 `database-engine/main`，Worker/Release materialization/finalize 已进入各自 `main`，HMAC verifier 与 `portal_data_product_results_v1` 已 promote 到 `edge-functions/main`；
3. 正确签名可调用；缺失/错误签名、篡改 body、过期 timestamp、重复 nonce、未知 keyId 均在业务逻辑前拒绝；old/new key 轮换通过；Dev/Main 使用不同 HMAC keyring、Supabase project 和 `portal:dev:v1` / `portal:main:v1` namespace，EdgeOne 只持有 Main current key。初始部署按 §10.3 共享经批准的 Upstash endpoint/token，验收证据明确 namespace 不是安全边界，并记录共享 token、配额、故障与轮换域风险；runtime 不读取通用 Redis 凭据，Redis guard 不可用时 LCIA 不调用数据库并显示暂不可用；
4. 无终端用户 Cookie/token 的代表性 Process/Flow 100 与 200 查询返回允许元数据；HMAC secret 不出现在浏览器；0/20、owner/team/review fixture 从 search、detail、versions、exchange、facet 和伪造参数入口均不可见；
5. UUID、CAS、分类码、中文名和英文名 lexical/identifier 查询通过，100/200 使用一个稳定 public-catalog 排序与 cursor；
6. Process/Flow exact-version 详情、版本列表、撤回 404 和 latest 307 通过；页面不直接读取 raw core table；
7. 每个公开 Exchange amount 同时具备 §10.2 所列 Process/Flow/amount/unit/direction/functional-unit/capability context；缺一项时不显示数值或比较；
8. 每个公开 LCIA result 同时具备 §10.2 所列 Process、功能单位、地理/精度、参考年、Method、impact、value/unit 和 publication/package context；无 publication 时显示 unavailable 而非 0；
9. 2–4 条比较先通过功能单位、单位、方法、地区精度、时间与边界矩阵；只有允许组合才并列 LCIA，Exchange 与 LCIA 使用各自上下文；
10. Citation 固定 exact version；本地候选集/JSON 经 schema 校验，不把备注发送到服务器；默认 fragment 只含 member IDs；
11. 首页、Browse、Process/Flow 详情和公开 LCIA 摘要进入初始 HTML；canonical、zh-CN/en hreflang、Dataset JSON-LD、robots，以及根级固定 64-way、双语 reciprocal、严格 5 MiB 的 sitemap index/shard 通过；sitemap 默认 `no-store`，仅在托管平台证明同步 300 秒/no-stale 后启用单一共享缓存；Search/Compare/Collections 为 noindex；
12. 默认浅色 `#5C246A`、深色 `#9E3FFD`；其他 semantic token 遵循 shadcn/Tailwind 最佳实践；自定义主色、Light/Dark Logo、favicon、alt、尺寸、fallback、manifest/OG metadata 和品牌回滚全部通过；
13. WCAG 2.2 AA 自动检查无 serious/critical，并完成键盘、屏幕阅读器、200% zoom、浅/深主题和三断点人工走查；
14. 浏览器 bundle、sourcemap、响应和日志中无 HMAC secret、service role、数据库 secret、内部 locator 或 Hybrid body；GET lexical `q` 的 24 小时 access-log 提示与 Referrer Policy 生效；
15. §18.1 的 R1 路由性能预算、§11.3 的 60 秒 visibility SLA/5 分钟 LCIA 与 sitemap SLA/cache isolation、§18.3 的错误与 fallback 指标均通过；
16. Portal、Database、Edge 的 PR/validation evidence 完整；所有 required main SHA 已由 root exact gitlink integration 验证，workspace coordination 和 child Issues 处于正确终态。

### 23.6 R2 Intelligent Discovery release checklist

1. `api.portal_hybrid_search_v1` 已进入 `database-engine/main`，Portal Hybrid adapter 已进入 `portal/main`，`portal_hybrid_search_v1` 已进入 `edge-functions/main`，对应 exact SHA 已通过 workspace integration；
2. Hybrid 复用 R1 canonical HMAC/keyring/nonce contract；无有效签名的直接 Edge 请求在 rewrite、embedding、模型和数据库之前拒绝；
3. Redis outage、重复 nonce、预算耗尽、并发竞争、lease 中断/TTL 回收和 `PORTAL_HYBRID_ENABLED=false` 均不产生模型调用；BFF 返回可观测原因并自动执行 lexical fallback；
4. 匿名 BFF 的 EdgeOne WAF、route/global budget 和 Edge 原子 admission gate 已通过并发/突发负载测试；验收证据明确 HMAC 不是访客鉴权或单独的成本边界；
5. 正常 Hybrid p95、8 秒超时、缓存、熔断、全局分钟/日预算、并发上限与 kill switch 演练通过，且不影响 identifier/lexical 基线；
6. Query interpretation、match reasons、proxy/group 展示全部带上游 evidence；无法支持的解释不生成，AI 文案不被当作数据库事实；
7. 日志不含原始自然语言、embedding、完整 UUID 列表或 secret；HMAC/guard/budget/concurrency/fallback 指标和告警可区分；
8. Hybrid-query 或含备注的 fragment 只在显式预览与二次确认后生成；默认分享仍不含查询原文或备注；R2 浏览器、无障碍、安全和主路径回归全绿。

## 24. 当前术语

| 术语                 | 定义                                                             |
| -------------------- | ---------------------------------------------------------------- |
| Process 过程         | TIDAS Process 数据集，精确身份为 `uuid@version`                  |
| Flow 流              | 产品流、基本流或废物流                                           |
| Process Group 过程组 | 只有上游给出稳定聚合结果时使用的 UI 分组，不是 Portal 存储实体   |
| 分配与建模方法       | ILCD/TIDAS 语境下的建模与分配信息；cut-off/APOS 等作为来源值展示 |
| Original             | 原始数据自带字段                                                 |
| Normalized           | 上游规范化产生的字段                                             |
| Derived              | 规则派生字段                                                     |
| AI inferred          | AI 推断字段，必须带置信度与理由                                  |
| Open                 | 后端明确允许显示公开元数据与相应数值能力                         |
| Metadata only        | 元数据公开，但数值能力未授权或不存在                             |

## 25. 官方参考

- [Next.js App Router 与 ISR](https://nextjs.org/docs/app/building-your-application/data-fetching/incremental-static-regeneration)
- [Tailwind CSS v4 Next.js 安装](https://tailwindcss.com/docs/installation/framework-guides/nextjs)
- [shadcn/ui 文档](https://ui.shadcn.com/docs)
- [Supabase Edge Function 配置与 `verify_jwt`](https://supabase.com/docs/guides/functions/function-configuration)
- [Supabase Edge Function Authorization Header](https://supabase.com/docs/guides/functions/auth-headers)
- [Supabase Edge Function Secrets](https://supabase.com/docs/guides/functions/secrets)
- [Supabase API keys 与权限边界](https://supabase.com/docs/guides/getting-started/api-keys)
- [Upstash Redis `SET` / `NX` / `EX`](https://upstash.com/docs/redis/sdks/ts/commands/string/set)
- [Upstash Redis `EVAL`](https://upstash.com/docs/redis/sdks/ts/commands/scripts/eval)
- [EdgeOne Makers Next.js 支持](https://pages.edgeone.ai/document/framework-nextjs)
- [EdgeOne Makers Build Guide](https://pages.edgeone.ai/document/build-guide)
- [EdgeOne Makers Cloud Functions](https://pages.edgeone.ai/document/cloud-functions)
- [EdgeOne Makers edgeone.json](https://pages.edgeone.ai/document/edgeone-json)
- [WCAG 2.2](https://www.w3.org/TR/WCAG22/)
