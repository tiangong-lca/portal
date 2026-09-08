---
lastReviewedAt: 2026-09-08
lastReviewedCommit: a7f0eabe92b4d12a599bb1ce131525bdff9dd4ea
title: Portal development workflow
docType: guide
scope: repo
status: active
authoritative: true
owner: tiangong-lca-portal
language: en
lastReviewedNote: "Reviewed for Portal #69: isolated real-geometry lifecycle sculpture, reproducible Blender assets, individual part review, reference-only PNG boundaries, light/dark interactions and renderer lifecycle validation. Public catalog rules and routes remain unchanged."
whenToUse:
  - when setting up Portal, choosing local checks, or using Storybook MCP and project skills
  - when changing repository tooling or documentation governance
whenToUpdate:
  - when setup, local validation, component tooling, or documentation ownership changes
checkPaths:
  - docs/development.md
  - AGENTS.md
  - README.md
  - .docpact/config.yaml
  - package.json
  - skills-lock.json
  - .storybook/**
  - scripts/**
  - .github/workflows/**
related:
  - AGENTS.md
  - docs/ui-system.md
  - .docpact/config.yaml
---

# Portal development workflow

## Setup and repository roots

Use the Node version in [.node-version](../.node-version) and the package manager and engines in [package.json](../package.json). [The toolchain check](../scripts/validate-build-toolchain.mjs) owns executable version validation. Run package commands from the Portal repository root:

```bash
pnpm check:toolchain
pnpm install --frozen-lockfile
pnpm dev
```

Resolve paths from inside the Portal checkout. In a workspace submodule, use the workspace Docpact wrapper; an independent checkout uses the repository's own wrapper:

```bash
portal_root="$(git rev-parse --show-toplevel)"
portal_workspace="$(git rev-parse --show-superproject-working-tree)"
portal_docpact="${portal_workspace:-$portal_root}/scripts/docpact"
"$portal_docpact" route --root "$portal_root" --paths src/components/ui/button.tsx --format json
```

Replace the example input with the paths being changed. These variables are reused in the checks below. An independent checkout can run local development and Docpact without a workspace. For tracked delivery, locate the configured workspace and read its root `AGENTS.md`, branch policy and delivery skill; the standalone Portal repository does not contain the workspace controller.

Use that workspace's `scripts/workspace-ops` for task creation/start, durable updates, PR submission and completion. Follow each returned next command. Keep implementation in Portal; its `main` PR must merge before a separate root task can integrate the exact eligible commit. Hosted release acceptance is a separate responsibility described by the [product plan](design-plan.md#17-edgeone-makers-部署).

## Choose local checks

Run the checks that demonstrate the changed behavior before committing or pushing. A passing check remains evidence for an unchanged diff; repeat it when code, inputs or relevant configuration change, or when investigating a failure. Use the scripts in [package.json](../package.json), and record the actual commands and results in the PR.

| Change | Local evidence |
| --- | --- |
| Documentation only | Format the touched Markdown/YAML, verify changed links and command examples, and run Docpact on the explicit changed paths. Product compilation and browser tests are unnecessary unless the edit changes an executable example or a runtime requirement. |
| Documentation routing | Add strict config, `doctor`, `coverage`, and representative `route` checks. Confirm both focused routes and retained security/deployment obligations. |
| Shared UI, styles or stories | Formatting, lint, typecheck and relevant behavior tests; `pnpm build:storybook`, `pnpm test:storybook`, and rendered keyboard/accessibility/theme/viewport review. Check affected product flows with `pnpm test:e2e -- <spec>` when the component participates in page behavior. |
| Pages, navigation or feature behavior | Formatting, lint, typecheck, relevant unit/integration tests, `pnpm build`, and the affected production browser specifications. Check all affected dictionaries and responsive states. |
| Server, DTO or security behavior | Relevant contract and negative-path tests, typecheck, build and the applicable production integration/browser checks. Include `pnpm check:database-contracts` when consuming the generated snapshot. |
| Dependencies, runtime/build configuration or deployment | Frozen install and affected tooling/build checks. Read the [runtime/deployment plan](design-plan.md#17-edgeone-makers-部署) and [compatibility matrix](r0/compatibility-matrix.md) when the change affects hosted behavior. |

`pnpm check` is the aggregate static, unit, build and bundle command when the change warrants that breadth. [CI](../.github/workflows/ci.yml) retains the complete required checks on PRs and `main`, including production browser and Storybook checks. Focused local verification does not waive CI or the [release acceptance requirements](design-plan.md#194-发布门).

Normal tests use fixtures and never contact Production. The read-only live probe is explicitly enabled with `PORTAL_LIVE_PROBE=true`; missing live credentials must remain a reported skip, not an inferred production pass.

## Storybook and MCP

Read the [UI standards](ui-system.md) before changing components. Storybook runs production components against synthetic data; the guide owns fixture, accessibility and visual review requirements.

```bash
pnpm storybook
pnpm build:storybook
pnpm exec playwright install chromium
pnpm test:storybook
```

Reuse a running server only after confirming it serves this Portal checkout. The repository script binds loopback port 6006 and fails if that exact port is occupied. Keep a server used for the delivered review available for the user. Static output is `storybook-static/`; it does not provide the development/test MCP endpoint or become an EdgeOne artifact.

Once the server is running, connect the local agent:

```bash
codex mcp add portal_storybook --url http://localhost:6006/mcp
codex mcp get portal_storybook
```

The connection is machine-local. If the current agent session has not loaded MCP tools, use the installed CLI from the same Portal directory:

```bash
STORYBOOK_FEATURE_AI_CLI=1 pnpm exec storybook ai --help
```

Read the current top-level and selected command help before forming payloads. Discover component documentation, inspect actual props/source, edit the component and stories, find affected stories, run interaction tests with accessibility enabled, then present a curated review. Use returned story IDs and review links. The installed CLI/MCP help owns current tool names and payloads.

Use existing pnpm scripts and `pnpm exec` for installed binaries when an upstream skill shows generic `npm` or `npx` examples. Do not initialize an existing Storybook or upgrade dependencies as a side effect of ordinary UI work. Permission requests follow the active environment and existing user authorization; a generic skill's sandbox guidance does not override them.

If MCP is unavailable, use the CLI. If that interface is also unavailable, continue applicable checks through repository scripts and inspect the rendered Storybook or product UI in the browser; report the unavailable review interface. A passing build alone does not prove visual quality or replace interaction/accessibility checks.

The isolated catalog references import locked Fontsource variable-font dev dependencies. Vite serves their Unicode-range assets locally; public Portal routes do not import them. The matching upstream OFL notices are retained in `.storybook/public/fonts/` and copied into static Storybook output. When updating these fonts, refresh their notices from the reviewed packages and verify the dependency license check, emitted assets and rendered Chinese/Latin metrics.

### Brand sculpture assets

`Brand Explorations/Lifecycle Sculpture` is an isolated Three.js study in `.storybook/brand-exploration/`. The assembly and focused part stories share the actual glass, node network, energy, factory, product and geographic point geometry. Optical materials, studio lighting, hover response and color transitions are computed at runtime. Reference PNGs are only used by `ReferenceComparison`; never use them as scene textures or an image underlay.

`modeling/build_models.py` owns the energy, factory and product authoring functions. Regenerate the editable `.blend` source and the optimized, texture-free GLB with Blender 5.1:

```bash
blender --background --python-exit-code 1 --python .storybook/brand-exploration/modeling/build_models.py
```

The authoring file retains individual equipment parts; the GLB merges meshes by material within each model group and preserves the animated turbine rotors. Model groups retain their base footprints as metadata for analytic contact shading, which is computed by a shader without a baked shadow image. `components/` owns the shared optical primitives, per-layer junction graph and procedural components. The geographic sampler produces `land-points.json` from Natural Earth's public-domain land polygons; source URL and SHA-256 are retained in the asset `NOTICE.txt`. Format regenerated point data with the repository's Prettier command before committing it.

Energy and factory materials use optical transmission against the study's theme background; keep the renderer background synchronized when changing themes. Thin cylinder geometry gives the network connections a stable physical width on high-density displays, including the connections within each layer. The network has stronger core links and lighter peripheral connections. Node materials add a continuous rim from the surface normal and view direction, while limiting fragmented environment highlights. The world-map component owns the decorative placement of the geographic samples inside its isometric plate.

Platforms overlap in projection. Their surfaces, cut edges and outlines are clipped by the upper platform's camera volume so the lower rear corner stays behind it. This clipping follows the actual animated geometry and camera; it does not hide the translucent network or require a screen-space mask image.

Finite area lights shape the product's metallic highlights. Equipment and network reflections use mirrored cameras and live geometry, including animated child transforms. Each visible reflected layer has one target capped at 768 pixels on its longer edge; the assembly uses four targets and focused part views render only their own reflection. Network reflections use a narrower blur than equipment reflections, and exclude view-facing glow sprites. The product's display plinth meets the outer platform's front corner, with its own light/dark sheen and small grid junctions. These passes share the existing animation loop and stop with it. Reflection clones share the mounted scene's geometry and materials, while their render targets are disposed separately before the owning scene is released.

The original light/dark boards are served from `.storybook/public/brand-exploration/`. `artwork.json` owns their dimensions, comparison crop, source paths and SHA-256 receipts. Keep those values and asset notices synchronized when deliberately replacing a selected reference. Model assets load from the Storybook host, and the renderer is a dev dependency; public Portal routes do not import this study.

Review individual parts at full size before reviewing the combined composition in both themes. Also verify independent color modes, desktop/mobile layout, pointer response, keyboard/touch activation, pause/reduced motion and failure recovery. Story loaders prepare an independent model template before mounting. The canvas draws its first real geometry frame synchronously so Storybook’s frozen review thumbnails do not capture a loading placeholder. Canvas resizing also repaints immediately because resizing clears the WebGL buffer while the embedded preview may already have frozen animation callbacks. Short windows keep the whole sculpture within the viewport; `CompactViewport` covers this layout. Standalone mounts retain asynchronous loading and failure recovery. Motion tests observe actual frame progression and wait through the bounded color transition before verifying that drawing stops. Pre-optimizing the imported Three.js modules prevents dependency discovery from reloading a running browser test. Passing checks does not establish user visual acceptance or a production homepage baseline; record fidelity differences and acceptance in the delivery Issue.

Storybook test files run sequentially in `vitest.config.ts`: software WebGL compilation otherwise competes with the other stories' focus and animation assertions. Its 30-second test deadline includes cold shader compilation and the complete interaction flow. Keep the existing per-assertion waits and motion checks; the deadline does not replace a rendered performance check or affect the unit-test runner.

## Project skills

For component work, read `.agents/skills/storybook-stories/SKILL.md`. Restore the generated skills when missing or when their committed lock changes, rather than reinstalling for every component edit:

```bash
pnpm skills:install
```

[skills-lock.json](../skills-lock.json) records the upstream commits, paths and hashes; [pnpm-lock.yaml](../pnpm-lock.yaml) locks the Skills CLI. Installation requires Git and GitHub network access. [The installer](../scripts/install-skills.mjs) restores into a temporary directory, verifies all original hashes, then installs `.agents/skills/storybook-{init,setup,stories,upgrade}/` with project names, cross references, LICENSE and UPSTREAM.md. The generated directories remain ignored; normal dependency installation, builds and CI do not download skills.

Restoration preserves the committed lock and existing skills on failure. Successful restoration replaces local edits in the four managed directories and preserves unrelated skills. Make persistent adaptations in the installer, not in generated files. [The license copy](../scripts/licenses/storybook-mcp.txt) and the lock retain upstream provenance.

For an intentional upstream update, review the source and license, then use its full commit SHA:

```bash
pnpm skills:update <40-character-storybook-commit-sha>
git diff -- skills-lock.json
```

The update command verifies the new installation before writing the lock. Commit the reviewed lock so other contributors can restore it. Update the Skills CLI itself with an exact reviewed dev dependency and commit the resulting package/lock changes. Recheck restoration after changes to the CLI, installer, source lock or license.

## Documentation ownership and checks

| Source | Owns |
| --- | --- |
| [AGENTS.md](../AGENTS.md) | Standing repository rules, orientation and task entrypoints. |
| This guide | Setup, local validation, Storybook/MCP/skills procedures and documentation workflow. |
| [UI standards](ui-system.md) | Shared visual, component, localization and isolated-review requirements. |
| [Product and technical plan](design-plan.md) | Feature behavior, data access, privacy, rendering and deployment requirements. |
| [Compatibility matrix](r0/compatibility-matrix.md) and [CSP/ISR evidence](r0/csp-isr-spike.md) | Hosted verification, retained platform defects and release evidence. |
| [.docpact/config.yaml](../.docpact/config.yaml) | Machine-readable ownership, routing, coverage and review obligations. |
| Package/configuration files, generated manifests and receipts | Executable versions, defaults, source commits and byte identities. |
| GitHub Issues and PRs | Delivery scope, decisions, validation, blockers and integration state. |

State current rules in their owning document and link there from summaries. Keep deployment IDs, resolved incidents and delivery chronology out of the standing agent instructions. Move still-useful evidence to its existing evidence record; remove obsolete narrative. Preserve meaningful behavior, limits and exceptions when condensing. Keep Next's marked block in `AGENTS.md` exactly as its installed generator writes it.

After editing, choose one explicit lint input (`--files`, `--staged`, `--worktree`, or a commit comparison). For example, after changing this guide:

```bash
"$portal_docpact" validate-config --root "$portal_root" --strict --format json
"$portal_docpact" lint --root "$portal_root" --files docs/development.md --mode enforce --format json --output /tmp/portal-docpact-review.json
```

For routing changes, also run `list-rules`, `doctor`, `coverage` and `route` with the same explicit root. Use the smallest relevant documents; a component-only change should not require hosted compatibility evidence. Inspect any uncovered path or diagnostic before changing rules. Use `review mark` only after the associated review is complete, then repeat lint with the same input. [The pre-push gate](../scripts/docpact-gate.sh) validates committed changes against `origin/main`; [the manual documentation workflow](../.github/workflows/ai-doc-lint.yml) runs the same gate in GitHub.
