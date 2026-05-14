# 文档路由 Markdown 预览 Todo 计划

## Summary

在侧边栏新增的 `documents` 一级菜单下，让每个子路由对应一个 `src/documents` 下的 `.md` 文件。点击子菜单时，统一进入一个 Markdown 预览页面，在浏览器内渲染对应文档。

## Implementation Changes

- 扩展 `src/config/menu.ts` 的 `MenuItem` 类型，新增可选字段 `document?: string`。
- 给 `documents_introduction` 子路由补充 `document: "README.md"`。
- 扩展 `src/router/generator.ts`，当菜单项存在 `document` 时，统一挂载 `src/views/Documents/MarkdownViewer.vue`，并写入 `route.meta.document`。
- 新增 `src/views/Documents/MarkdownViewer.vue`，通过 `import.meta.glob("@/documents/**/*.md", { query: "?raw", import: "default" })` 加载 Markdown 原文，并使用 `markdown-it` 渲染。
- 补充中英文 i18n 文案。

## Test Plan

- 运行 `pnpm build`，确认路由生成、Markdown raw import、类型检查都通过。
- 本地启动 `pnpm dev` 后验证侧边栏文档菜单、`#/documents/introduction` 页面预览、刷新访问和控制台警告。
- 后续新增文档时，只需要新增 `.md` 文件并在 `menu.ts` 子路由中配置 `document`。

## Assumptions

- 文档源目录固定使用 `src/documents`。
- “项目说明”对应 `src/documents/README.md`。
- Markdown 渲染使用 `markdown-it`。
