---
lastReviewedAt: 2026-09-09
lastReviewedCommit: 921e2e8d061f37fe6a1d6c3dd280c013f708ac99
title: Portal UI and component standards
docType: contract
scope: repo
status: active
authoritative: true
owner: tiangong-lca-portal
language: zh-CN
lastReviewedNote: "Reviewed for Portal #75: wider homepage composition, removal of redundant platform and artwork instructions, and bounded input-driven hero motion without a visible playback toolbar; standalone study controls remain available."
whenToUse:
  - when changing shared UI, branding, localization, accessibility or Storybook scenarios
whenToUpdate:
  - when visual, component, dictionary or isolated-review requirements change
checkPaths:
  - docs/ui-system.md
  - src/components/**
  - src/config/brand*
  - src/app/globals.css
  - src/i18n/**
  - public/brand/**
  - .storybook/**
related:
  - AGENTS.md
  - docs/development.md
  - docs/design-plan.md
---

# Portal UI 与组件规范

本文拥有共享视觉、组件、无障碍、国际化和隔离场景的要求。[开发指南](development.md#storybook-and-mcp)拥有 Storybook/MCP/skills 的启动、操作与验证步骤；[产品方案](design-plan.md#7-页面与交互)拥有搜索、详情、比较与清单的业务行为。修改组合场景时，按涉及的业务读取对应章节。

## 设计方向

公开首页采用“精密科技”品牌方向：以已确认的生命周期雕塑建立 Tiangong LCA 识别，用明确标题、连续分区和可执行入口连接数据与产品平台。搜索、详情、浏览与清单继续采用“专业科学数据目录”：信息结构稳定、留白克制、分隔清楚、检索优先。品牌首页不覆盖这些数据任务页面的布局。

可识别的核心元素是连续目录索引：Process、Flow、地区与来源共享一个表面与统一行结构，帮助访问者建立数据空间坐标。首页不把 provenance 状态做成装饰性证据轨；版本、来源、许可、方法、质量和 publication 等信任信息只在目录概览、结果行或记录页的实际使用位置出现。

品牌紫只用于主要行动、链接、焦点和少量导航信号；Source Sans 3 承担正文与标题，IBM Plex Mono 只用于 UUID、版本、日期、计数和确有必要的技术标识。Card、Table、Alert、Empty、Input Group、Button 与 Separator 使用 shadcn/ui 语义 token，浅色与深色分别校准。目录任务页面不加入渐变英雄区、装饰插画、伪统计、悬浮玻璃卡或与数据任务无关的品牌口号。品牌首页的几何与专属材质按下述已采纳组件要求实现；任何页面都不编造统计或产品能力。开发阶段的 `R1/R2`、`LEXICAL/HYBRID`、`POST`、`LIVE · 5 MIN`、`LOCALSTORAGE`、rank、score、reason code、schema、BFF、façade、telemetry 等标签不得出现在公众 UI。

公众文字遵循“用户先于实现”的顺序：先说明能做什么、看到什么、下一步是什么，再在必要位置解释限制。按钮使用可预期动作；错误同时说明状态与恢复方式；空态提供下一步；不把内部安全/缓存/发布结构当作卖点。首页首屏建立 Tiangong LCA 品牌识别并提供数据和平台入口；Search 只显示完成检索所需的字段，完整技术与质量原文进入详情页。

术语冲突按以下顺序收敛：

1. TIDAS/ILCD glossary 拥有 Process、Flow、Exchange、functional unit、reference flow、LCI/LCIA、review/validation/compliance 等领域概念；
2. `tiangong-lca-next` 当前 locale style guide 拥有四语 UI 语气、按钮、错误和产品术语（例如法语普通产品文案使用 `ÉICV`）；
3. `tiangong-lca-next-docs` 当前四语内容提供公众任务表达与帮助链接；
4. Portal 只在匿名只读场景下缩短说明，不改变领域含义；无法本地化的上游数据值显示来源语言，不伪装成本地翻译。

信息架构参考同类公开数据服务的成熟做法：Federal LCA Commons 以仓库与数据集发现为中心；GBIF 在首屏给出直接价值陈述与主搜索；NASA Earthdata 把搜索、主题浏览和工具入口分层；European Platform on LCA / LCDN 在记录语境中强调提供方、版本、方法、质量和文档。Portal 只借鉴这些任务层级与信息边界，不复制其视觉资产、文案或品牌。

常规 Button、Input、Select、InputGroup 和 Toggle 使用 44px 高度（多行按钮为最小高度）；`sm` 为 32px 紧凑尺寸，Button 的 `xs` 24px 仅用于有明确密度需求的内嵌操作，`lg` 为 48px。Button/Select/Toggle 使用 `size`，Input/InputGroup 使用 `controlSize`，保留原生 Input 的 `size` 字符宽度属性。Sheet 关闭按钮使用 44px。`ActionGroup` 在窄屏按两列等宽排列，同一行控件拉齐；长本地化标签完整换行。

Toggle 的选中态具有持续的边框、浅色背景和下划线；比较选择以勾选图标标明状态，保留稳定的可访问名称和 pressed/checked 语义。禁用态只作用于控件，组内仍需阅读的说明保留正常对比度。InputGroup 附加区域将焦点转给相应的可用 Input 或 Textarea，按钮保留自己的操作。

输入输出表主要显示流、方向、类型、原始数量与单位及定量参考意义。数量右对齐并与单位保持同行，禁止转换为浮点数或改变精度。逐行原生展开项保留 Flow/Process 精确版本、功能单位和展示依据，支持键盘；移动端使用相同信息层级。

## 默认主色：与 `tiangong-lca-next` 一致

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

## 可替换主色配置

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

## Logo 与 favicon 替换

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
- Light/Dark/System 切换同步选择对应 Logo；在 `<html>` 水合前用带 SRI 的同源外部主题脚本恢复 localStorage 偏好，System 模式使用 `prefers-color-scheme`，避免 Logo 与主题 hydration flash；
- Header、移动导航、favicon、manifest icons、Open Graph image/brand metadata 使用同一 `BrandConfig`；
- Alt 文本本地化；旁边已有可见品牌文字时纯图形 mark 使用 `alt=""`；
- Logo/主色替换不提供匿名上传或管理 API。通过 EdgeOne 环境变量或受审查的 `public/brand/**` 资产修改，重新部署后生效。

## 字体与密度

- 西文/数字：`Source Sans 3`；
- CJK：`Noto Sans SC` / `PingFang SC` / `Microsoft YaHei` 回退；
- UUID、版本、数值：`IBM Plex Mono`，启用 tabular numerals；
- 正文 14px 起，主要结果行触达高度不低于 44px；
- 8px 布局网格，6px 基础圆角，细边框优先于阴影；
- 字体从站点自身提供或使用可靠系统回退，不依赖运行时访问 Google Fonts。

## shadcn/ui

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
- Select 菜单有可访问名称，展开时背景使用原生 `inert` 隔离焦点，关闭或卸载后恢复既有属性与触发器焦点；
- Badge、Empty、Alert、Skeleton、Separator 使用官方组件，不手搓同类 markup；
- 业务组件组合 shadcn primitives，`components/ui` 保持可追踪上游差异。

## 无障碍、国际化与响应式

### 无障碍

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
- 人工发布验收不设置 VoiceOver/屏幕阅读器走查门；语义 HTML/ARIA、自动 WCAG、纯键盘、焦点、缩放、reduced motion、主题与响应式要求保持不变。

### 国际化

- 正式公开 `zh-CN`、`en`、`de` 与 `fr`，URL 段与 html lang 分别保持这四个规范值；与 Docs/TIDAS 的 `/de`、`/fr` 公共路径一致，不把 Next 内部 `de-DE`/`fr-FR` adapter tag 暴露为 Portal URL；
- 使用 `next-intl` 的 locale segment 与 Server Component 消息加载；
- 日期、数字、单位和复数规则本地化；
- 四份消息字典具有完全相同的闭合 key topology；缺 key、整段英语复制、未翻译开发标签或跨语言 UI fallback 均使构建/测试失败；
- UI 语言与数据内容语言分离；
- 数据字段回退到其他语言时明确标记来源，不伪装成本地化原文；
- 切换语言保留同一对象、版本、查询和分面。

### 响应式

- `>=1280px`：三栏完整工作区；
- `768–1279px`：分面 Sheet + 收起托盘；
- `<768px`：单列、以查询和阅读为主；比较保留已选候选，按字段组织卡片与定义列表，候选数量遵守[比较功能要求](design-plan.md#74-比较)；
- 地图移动端默认表格视图；
- 高密度表格在窄屏改为定义列表，不横向压缩关键信息。

## Storybook 场景与审阅

[Storybook 配置](../.storybook/main.ts)使用 Next.js Vite framework，CSF stories 与合成 fixture 留在 `.storybook/`。场景直接导入已有基础组件及业务组合，预览复用生产 CSS、生成的品牌 token、字体栈和四套实际字典；工具栏同步 document 的主题、语言和视口。MSW 的 `mockServiceWorker.js` 只生成到 `.storybook/public/`，不进入 Portal 的公开资产或 EdgeOne 产物。

服务端展示组件在 loader 中执行；Vite alias 仅替代请求级翻译和服务端品牌配置，避免引入 Next 请求运行时。搜索页与场景共用 FacetsPanel。MSW 拦截同源 API，fixture 通过实际请求 schema 校验输入；主题和清单场景初始化并恢复专用存储键，不接触线上数据或生产凭据。

每个变化覆盖相关正常、空、加载、失败、禁用、选中、缺失字段、长文本或窄屏状态。交互使用 `play` 验证用户可观察行为，按请求显式释放响应，不依赖固定延时。保留 Hybrid 早期结果与选择、显式应用更新、旧请求取消、迟到结果、失败/过期续页，以及清单导入预览/确认/取消、备注分享确认和容量限制等回归场景。

无障碍检查统一为 `error`，展开后的 Select 也必须检查。实际浏览器复核焦点恢复、键盘、浅深主题、四语长标签和窄屏；原生锚点、默认键盘行为、页面布局与跨页导航继续由生产 E2E 验证。Storybook 的自动检查不等于视觉设计通过，也不建立截图差异基线。

组件及组合提供准确的 `component` / `subcomponents` 与 `@import` 模块引用。[manifest 检查](../scripts/check-storybook-manifest.mjs)验证覆盖、真实导入与关键 Props。Autodocs 和 Component Meta 的编译器适配由[精确包 hook](../scripts/pnpm-hooks.cjs)管理，版本以脚本和锁文件为准；升级时重新验证实际 API 文档、MCP 协议和场景。

比较先显示需要关注的字段，并保留展开查看所有字段；LCIA 数值和单位保持原样，数据集/方法的精确版本可展开。目录覆盖与通过测试不能替代面向数据使用者的视觉审阅。

### 品牌首页与生命周期组件

`src/components/brand/` 拥有实际首页、轻量加载岛和 `lifecycle/` 中的共享渲染组件。`Brand/Homepage` 场景复用生产页面与四语字典；`Brand Explorations/Lifecycle Sculpture` 保留独立部件、姿态与参考对照审阅。组件使用可编辑的真实三维模型、程序化几何与实时材质，独立场景分别校准各个部件；五层透明结构分别呈现节点网络、能源、制造、产品与点阵地图；这些是视觉隐喻，不是数据覆盖、计算结果或科学证据。图形两侧不附文字标签。

亮暗模式分别校准材质、边缘光、对比度与底部阴影；品牌紫与多彩模式是独立于主题的展示状态。鼠标带来小幅视差和局部节点/连线高亮，点击、触屏轻点或 Enter/Space 切换色彩。拖动滚动不触发变色；暂停保留当前姿态，减少动态效果时保持静态但仍可切换主题和颜色。控件复用正式 Button，名称属于实际四语字典 `Sculpture`，提供焦点、加载与失败恢复。首页图形直接响应鼠标、点击和键盘，不显示色彩或暂停工具栏，主题跟随全站设置；空闲时静止，最后一次输入后 1.5 秒停止运动，减少动态效果时不启动交互运动。独立研究场景保留色彩、暂停、主题和重置工具栏。离屏、隐藏页面或静止状态不持续绘制，卸载释放 GPU 和异步加载资源。

跨层连线通过实际空间位置与模型形成遮挡，节点尺寸与形状分别校准。调整连接后验证完整的流动光点循环，避免只检查静止画面或首帧。

视觉验收对照用户选定的亮暗参考图核对整体俯角、各层透视缩短、上下平台遮挡、构图与层距，再核对模型细节、透明材质、点阵密度和动效，不以自动测试替代。图形的局部色彩与材质值由共享渲染组件拥有；字体和控件保持 Portal 语义。生产首页按需加载 Three.js 和同源无纹理模型；其他目录路由不预加载 renderer 或模型。原稿仅出现在明确标注的对照区域，不作为组件底图或纹理。模型、透明板、节点和连线需要分别可修改，反光、悬停高亮与视差由前端实时计算。原稿、裁取参数与校验信息见[开发指南](development.md#brand-sculpture-assets)。

首页使用 Source Sans 3 Variable 与 Noto Sans SC Variable 的同源字体资产，标题、说明、正文和辅助文字分别设定角色。主标题与图形并列，窄屏按文字、入口、图形顺序堆叠；分区沿同一内容宽度对齐，搜索区域用独立中性表面区分。亮暗背景分别与渲染场景匹配，紫色用于品牌强调与主要操作。宽屏内容区域上限为 1680px，标题与图形按可用宽度放大；图形两侧不附设备标签，底部不显示交互说明与演示控件。平台入口保留明确名称与外链图标，不重复显示域名及登录说明。图形的操作说明仍通过可访问描述提供。加载失败以可编辑 SVG 轮廓退化，不以原稿图片替代。所有搜索与产品入口在等待模型时保持可用。

首页的 `BrandHome` 复用实际公共目录摘要，不将合成 fixture 引入生产；Storybook 场景必须明确其摘要是合成输入。示例计数仅在目录概览区域出现。`BrandSculpture` 延迟加载场景，避免将 Three.js 纳入首页基础脚本预算；模型与动态脚本另行记录实际传输体积，不能将基础脚本预算误报成页面全部下载量。

支持 OffscreenCanvas 时，首页在独立 Worker 中执行完整渲染，将输入与导航留在页面主线程。Worker 与组件审阅使用相同的渲染核心和画质；主题、色彩、暂停、离屏与卸载状态必须同步。验证首页响应速度时需要等待真实图形就绪，不能以占位图或加载失败状态作为性能通过的证据。

### 完整页面设计样板

尚未采纳的页面设计可放在 `.storybook/catalog-reference/`，由 `Design references/Catalog pages` 的完整场景独立审阅。样板复用正式基础组件、品牌、语义 token 与四语字典；页面布局和样板状态只存在于 Storybook，公开路由不得导入这些模块或样式。通过设计审阅后，再以独立交付将选定的组合模式接入实际页面和服务端数据契约。

样板使用明确标注的合成身份、记录、匹配说明和计数。交互覆盖查找、筛选、选择、打开详情、返回、候选清单与引用，状态只保留在当前预览中。示例数值保持精度，缺失信息保持缺失，字段对齐不提供科学可比性结论。该样板不验证真实排名、动态分面、线上许可或公开能力。

搜索样板以连续记录、对齐的地区/时间/单位和可读的匹配片段为核心；详情样板先展示参考产品、单位、地区和时间，再展开范围、输入输出、证据与精确版本。设计验收需要完整页面的桌面、窄屏、浅深主题与长文本审阅；自动测试通过不代表该提案已经成为正式设计基线。

样板通过开发依赖随站点提供 Source Sans 3 与 Noto Sans SC 可变字体，仅在样板及其弹层作用域内使用。辅助说明、正文、长文阅读、记录标题和页面标题采用明确的字号角色；中文标题保留自然字距，西文标题只做轻微收紧。搜索结果按标题与身份标签、地区/时间/单位、匹配摘要连续排列；详情阅读列与侧栏共同决定列宽，不再在宽列中另加脱离网格的正文宽度限制。主要搜索保留 44px 控件，详情和行内操作使用 32px 紧凑尺寸，手机的详情操作与逐行收藏恢复至少 44px。字体大小、字重、圆角与密度的这些调整属于待审样板，不能据此覆盖全站正式组件。

搜索样板在分面侧栏收起时，将筛选入口与排序放在同一结果工具栏；手机上这组操作排到结果数量下方，触控高度至少 44px。搜索结果与详情中的独立版本号统一使用 24px 高、13px 字号、4px 圆角的中性标签，采用正文字体与等宽数字，保留 `v` 前缀和原始版本字符串；标签是文本，不提供操作。完整 UUID@version 与精确数量仍保留技术字体。结果中的版本标签与公开内容图标采用一致的 24px 浅底、细边框和小圆角，整体跟随标题，空间不足时一起换行，不再在摘要下固定占一行。图标的可视尺寸与手机 44px 实际触控区域分开处理，并与相邻标题和收藏操作保持分离。公开内容状态使用图标，悬停、键盘聚焦和点击均可查看说明，支持 Escape、移出焦点和点击外部关闭；手机图标触控区域至少 44px。筛选选项与详情仍显示“含输入输出”或“仅数据说明”的四语文字，不用勾号暗示审核、质量或许可结论。

样板搜索框下不再重复展示搜索模式或隐私提示；这不改变真实搜索与分享流程的隐私要求。合成数据说明在页面底部统一展示。样板未提供逐条来源名称，列表和标题区不补造统一来源，详情来源显示“未提供”，示例引用只组合已有的名称、年份和精确版本标识。

### Catalog 共享业务组件

`src/features/catalog/dataset-tags.tsx` 统一拥有 `DatasetVersionTag` 与 `PublicContentTag`，旁置 CSS 拥有标签尺寸与说明弹层样式。组件只接收精确版本、公开内容状态和本地化文案，不依赖 Storybook fixture、整条记录或页面 CSS。`components/ui` 继续拥有通用 Badge、Button 等基础组件；页面负责标签的位置、分组和换行。`Catalog/Dataset tags` 提供独立的图标、文字、浅深主题、窄屏和键盘说明场景。搜索与详情样板、正式详情的 `DetailHeader` 共用这些标签；其他正式页面仍按各自组合评审。

`ResultsContinuation` 统一拥有游标列表底部的加载更多、加载中、失败重试与末尾展示；调用方传入已本地化的进度说明，不要求服务返回总数。搜索样板使用六条一批的合成分页来展示交互，不改变实际搜索的分页上限或游标契约。追加结果保留已选内容，将焦点交给首条新增记录；进入详情再返回保留已加载结果。新查询、分面或排序重置续页并忽略迟到响应；空结果不显示续页控件。稳定状态场景与重试、返回和请求隔离的交互场景分别保留。

### 详情页与样板面板的布局

正式 `DetailHeader` 使用 28px 桌面标题和 24px 手机标题，长名称自然换行；种类、独立版本和显式公开能力组成紧凑身份行。顶部只保留一个引用按钮，点击打开居中弹窗，正文中不再重复引用折叠入口。弹窗包含引用正文、精确标识及复制操作，支持 Escape 和关闭按钮，关闭后焦点返回顶部入口；既有 `#citation` 链接在客户端就绪后打开同一弹窗，关闭时清除该 hash。桌面操作按内容宽度排列，手机触控目标至少 44px；复制失败保留可手动复制的内容。详情子页面继续使用原生链接。

正式 `OverviewPanel` 首先展示使用背景：Process 的参考产品、功能单位、地区和参考年；Flow 的 CAS、类型和参考流属性。说明与技术正文在阅读列，来源、许可和证据在侧栏，窄屏按阅读顺序堆叠。仅展示已提供的原始名称与说明，缺失字段不从其他类型推断。

样板的候选清单保留完整名称、精确版本、地区/时间/单位和独立移除操作；空态提供返回目录入口。核对面板桌面按字段对齐，窄屏先列候选名称与版本，再按字段展示带稳定候选序号的值。核对中的版本使用中性辅助文字，保留 `v` 前缀和原始字符串；UUID 作为独立字段与其他值对齐展示，不再增加单独的标识折叠区。字段对齐不作科学可比性结论。打开面板时焦点位于标题并保持顶部阅读起点。稳定空态、多条记录、浅深主题、长本地化文字及移除/打开详情的交互分别保留场景。
