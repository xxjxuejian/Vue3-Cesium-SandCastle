# Vue3 Cesium SandCastle

一个基于 `Vue 3 + TypeScript + Cesium` 的示例项目，目标是用菜单化、模块化方式组织 Cesium 常见能力与案例，便于学习、演示与二次开发。

## 在线访问

- GitHub Pages 地址：[https://xxjxuejian.github.io/Vue3-Cesium-SandCastle/](https://xxjxuejian.github.io/Vue3-Cesium-SandCastle/)

## 项目背景

- 项目名称：`vue3-cesium-sandcastle`
- 项目定位：Cesium 示例集合站点，覆盖入门、2D/3D 视图、相机、实体、模型、动画等模块
- 组织方式：通过配置驱动菜单与路由，按分类管理 `src/views` 下的示例页面
- 数据来源：首页案例目前使用 `public/mock/galleryListData.json`，同时保留了 API 与转换工具以支持切换数据源

## 技术栈

- 框架：`Vue 3`（Composition API） + `TypeScript`
- 构建：`Vite 7`
- 地图引擎：`Cesium 1.137`
- UI：`Element Plus` + `@element-plus/icons-vue`
- 路由：`Vue Router 4`（`createWebHashHistory`）
- 状态管理：`Pinia`
- 国际化：`vue-i18n`
- 请求库：`axios`
- 样式与工程化：`Sass`、`UnoCSS`、`ESLint`、`Prettier`、`Stylelint`
- 自动导入：`unplugin-auto-import`、`unplugin-vue-components`

## 目录结构

```text
vue3-cesium-sandcastle/
├─ public/
│  ├─ SampleData/                 # Cesium 示例模型与静态资源文件
│  └─ mock/                       # 首页示例数据
├─ src/
│  ├─ api/                        # 接口封装
│  ├─ components/                 # 通用组件（含 CesiumViewer）
│  ├─ config/                     # 菜单配置（路由源）
│  ├─ hooks/                      # Cesium 与通用 hooks
│  ├─ lang/                       # 国际化配置与语言包
│  ├─ layout/                     # 后台式主布局（侧栏/顶栏/内容区）
│  ├─ plugins/                    # 插件统一注册入口
│  ├─ router/                     # 路由初始化与动态生成
│  ├─ stores/                     # Pinia store
│  ├─ utils/                      # 工具函数
│  ├─ views/                      # 各 Cesium 示例页面
│  ├─ App.vue
│  └─ main.ts
├─ vite.config.ts                 # Vite 配置（含 Cesium 静态资源复制）
└─ package.json
└─ uno.config.ts                  # UnoCss 配置
└─ .env.local                     # 本地环境变量配置
```

## 核心模块

- 应用入口：`src/main.ts`
  - 设置 `window.CESIUM_BASE_URL`
  - 读取 `VITE_CESIUM_ION_TOKEN` 并配置 Cesium Ion Token
  - 注册路由、状态、i18n、图标等插件
- 配置驱动路由：`src/config/menu.ts` + `src/router/generator.ts`
  - 通过菜单配置递归生成路由树
  - 通过 `import.meta.glob("@/views/**/*.vue")` 动态匹配页面组件
- Cesium 基础封装：`src/components/Cesium/CesiumViewer.vue` + `src/hooks/useCesium.ts`
  - 统一初始化与暴露 viewer 实例
  - 在组件卸载时销毁 viewer，避免内存泄漏
- 布局壳层：`src/layout/`
  - 侧边栏、导航栏、主内容区解耦
  - 由 `app.store` 控制侧栏折叠与语言状态
- 首页聚合：`src/views/Home/index.vue`
  - 加载并展示案例卡片
  - 提供关键词与标签过滤

## 关键设计

### 1) 菜单即路由源（配置驱动）

通过 `menu.ts` 维护站点结构，`generator.ts` 自动生成对应路由，减少手写路由重复并保持菜单与页面一致性。

### 2) Cesium 静态资源路径与部署路径解耦

- `vite.config.ts` 使用 `vite-plugin-static-copy` 将 `node_modules/cesium/Build/Cesium/*` 复制到构建产物中的 `cesium-static/`
- 运行时在 `main.ts` 中通过 `BASE_URL + VITE_CESIUM_STATIC_TARGET_URL` 设置 `CESIUM_BASE_URL`
- 该设计可适配 GitHub Pages 子路径部署（本项目 `base` 为 `/Vue3-Cesium-SandCastle/`）

### 3) Viewer 生命周期管理

- 使用 `shallowRef + markRaw` 持有 Cesium Viewer，避免复杂对象进入深层响应式代理导致性能问题
- 在 `onUnmounted` 中显式销毁 viewer，防止路由切换后的资源泄漏

### 4) 国际化与路由标题联动

- `lang/utils.ts` 通过 `route.xxx` 规则翻译菜单与卡片标题
- 未命中语言 key 时回退原始文案，保证可用性

## 启动与开发

### 环境要求

- Node.js：`^20.19.0 || >=22.12.0`
- 包管理器：`pnpm`

### 安装依赖

```bash
pnpm install
```

### 本地开发

```bash
pnpm dev
```

启动后访问终端输出的本地地址（默认通常为 `http://localhost:5173`）。

### 生产构建

```bash
pnpm build
```

### 本地预览构建结果

```bash
pnpm preview
```

## 部署说明（GitHub Pages）

- 项目已部署地址：[https://xxjxuejian.github.io/Vue3-Cesium-SandCastle/](https://xxjxuejian.github.io/Vue3-Cesium-SandCastle/)
- 当前配置已包含：
  - `vite.config.ts` 中 `base: "/Vue3-Cesium-SandCastle/"`
  - Cesium 静态资源复制与 `CESIUM_BASE_URL` 运行时设置
- 若更换仓库名或 Pages 子路径，请同步调整：
  - `vite.config.ts` 的 `base`
  - 相关环境变量（尤其 `VITE_CESIUM_STATIC_TARGET_URL`）
