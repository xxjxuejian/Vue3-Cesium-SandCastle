---
name: sandcastle-port-demo
description: Port Cesium Sandcastle examples into this Vue 3 + TypeScript + Cesium project. Use when Codex needs to create a new example page from sandcastle.cesium.com, adapt Sandcastle JavaScript/HTML/CSS into a Vue SFC, add the page under src/views, register it in src/config/menu.ts, handle Cesium assets and Ion token requirements, and verify the result with build or local dev checks.
---

# Sandcastle 示例迁移

将 Cesium Sandcastle 官方示例迁移到当前 Vue 3、TypeScript、Vite、Cesium 项目中。优先保持示例行为与官网一致，同时适配本项目的 `CesiumViewer`、菜单配置和动态路由模式。

## 快速流程

1. 明确目标示例：确认 Sandcastle 示例名称、URL、分类、期望放入的菜单位置和路由名称。
2. 读取项目约定：需要时查看 `references/project-patterns.md`。
3. 分析 Sandcastle 源码：识别 Cesium 初始化参数、Viewer 操作、UI 控件、CSS、异步资源和 SampleData 依赖。
4. 创建 Vue 页面：在 `src/views/<Category>/<DemoName>.vue` 新建单文件组件，优先使用 `assets/DemoTemplate.vue` 的结构。
5. 迁移示例逻辑：把 Sandcastle 的全局脚本改成 `handleMapLoaded(viewer)`、Vue 响应式状态、组件方法和模板控件。
6. 注册菜单：更新 `src/config/menu.ts`，让 `component` 指向新页面相对 `src/views` 的路径。
7. 补充国际化：在 `src/lang/packages/zh-cn.js` 和 `src/lang/packages/en.js` 的 `route` 字段中补齐 `meta.title` 对应的中英文文案。
8. 验证：运行 `pnpm build`；涉及页面交互或可视效果时启动 `pnpm dev` 并用浏览器检查。

## 迁移规则

- 不在页面中重新创建 `new Cesium.Viewer`，统一使用 `@/components/Cesium/CesiumViewer.vue`。
- 将 Sandcastle 的 `viewer` 相关逻辑放入 `handleMapLoaded(viewer: Cesium.Viewer)`。
- 将 Sandcastle 工具栏 API 改写为 Vue 模板控件：
  - `Sandcastle.addToolbarButton` -> `<button>` 或 Element Plus 按钮。
  - `Sandcastle.addToolbarMenu` -> `<select>`、Element Plus 下拉框或分段控件。
  - `Sandcastle.addDefaultToolbarButton` -> 组件方法和默认状态。
  - `Sandcastle.reset` -> `onUnmounted` 清理或重置方法。
- 将裸 DOM 查询、事件绑定和字符串拼接 UI 改为 Vue 响应式状态。
- Cesium 类型使用 `import * as Cesium from "cesium";` 或 `import type * as Cesium from "cesium";`，按实际是否需要运行时代码选择。
- 示例需要 Ion token、Google 数据、地形、影像或 3D Tiles 时，明确标注依赖，不提交个人 token。
- 需要静态资源时优先复用 `public/SampleData/`；缺失资源要说明来源和放置路径。
- 页面样式保持地图全屏占满父容器，浮层 UI 使用 `position: absolute`，避免阻塞地图交互，除非控件需要点击。

## 项目文件

- 详细项目约定见 `references/project-patterns.md`。
- Sandcastle 到 Vue 的迁移细则见 `references/sandcastle-porting-rules.md`。
- 菜单和路由规则见 `references/menu-rules.md`。
- 页面骨架见 `assets/DemoTemplate.vue`。
- 如只需要生成页面骨架，可运行 `scripts/scaffold-demo.mjs`，但菜单插入仍需人工检查。

## 验证清单

- 新页面路径存在，文件名使用 PascalCase。
- `src/config/menu.ts` 的 `component` 字段与真实文件路径完全一致。
- `name` 在 Vue Router 中全局唯一。
- `meta.title` 对应的 key 已同时写入 `src/lang/packages/zh-cn.js` 和 `src/lang/packages/en.js` 的 `route` 字段。
- `pnpm build` 通过。
- 涉及异步加载时，有 `await`、错误处理或合理的加载顺序。
- 涉及事件、定时器、dataSource、primitive 或 entity 批量创建时，组件卸载时不会泄漏。
