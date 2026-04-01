## 项目说明（PROJECT）

本项目 `vue3-cesium-sandcastle` 是一个基于 **Vue 3 + TypeScript + Cesium** 的示例集合站点，目标是用“后台式布局 + 配置驱动菜单/路由 + 模块化页面”的方式沉淀 Cesium 常见能力，便于学习、演示与二次开发。

该文档侧重于项目当前已完成并稳定可复用的部分：工程化接入、站点结构、路由生成机制、Cesium Viewer 封装、示例页面范式，以及可复制的扩展流程。

---

## 技术栈

- **框架**：Vue 3（Composition API）+ TypeScript
- **构建**：Vite 7
- **三维引擎**：Cesium `^1.137.0`
- **UI**：Element Plus + `@element-plus/icons-vue`
- **路由**：Vue Router 4（Hash：`createWebHashHistory`）
- **状态管理**：Pinia（持久化：`useStorage`）
- **国际化**：`vue-i18n`
- **请求**：axios（当前首页数据以本地 mock 为主）
- **样式/工程化**：Sass、UnoCSS、ESLint、Prettier、Stylelint
- **自动导入**：`unplugin-auto-import`、`unplugin-vue-components`

---

## 快速开始

### 环境要求

- **Node.js**：`^20.19.0 || >=22.12.0`
- **包管理器**：`pnpm`

### 安装与启动

```bash
pnpm install
pnpm dev
```

### 构建与预览

```bash
pnpm build
pnpm preview
```

---

## 环境变量与部署约定

项目使用 Vite 环境变量（加载优先级：`.env.local > .env.development > .env.production > .env`）。

### Cesium 静态资源（关键）

为避免直接从 `node_modules` 读取静态资源，项目在构建时会把 Cesium 的 `Build/Cesium` 复制到打包产物中（默认复制到 `dist/cesium-static/`）。

- **构建侧**：`vite.config.ts` 使用 `vite-plugin-static-copy` 复制 `node_modules/cesium/Build/Cesium/*` 到 `VITE_CESIUM_STATIC_TARGET_URL`
- **运行时**：`src/main.ts` 设置 `window.CESIUM_BASE_URL = ${import.meta.env.BASE_URL}${VITE_CESIUM_STATIC_TARGET_URL}/`

### Cesium Ion Token（可选但常用）

在 `.env.local`（建议加入 `.gitignore`）配置：

```ini
VITE_CESIUM_ION_TOKEN=你的token
```

未配置会在控制台输出警告，部分在线资源（Ion）可能无法加载。

---

## 项目架构与关键设计

### 1) 菜单即路由源（配置驱动）

- **菜单配置**：`src/config/menu.ts`
- **路由生成**：`src/router/generator.ts`

核心逻辑：通过 `import.meta.glob("@/views/**/*.vue")` 获取所有页面组件的动态 import 映射，再将 `menu.ts` 中的 `component` 字段拼接为 `/src/views/${item.component}` 来匹配并挂载到路由记录上。

> 约定：`menu.ts` 的 `component` 必须是**相对 `src/views` 的路径**，并且以 `.vue` 结尾，例如：`"3DModels/Clamp3dModel.vue"`。

### 2) 路由结构（Layout 壳层 + 动态子路由）

- **固定路由**：`src/router/index.ts` 中 `/` 先加载 `src/layout/index.vue`，并默认重定向到 `/home`
- **动态路由**：初始化时通过 `generateRoutes(menuConfig)` 生成路由数组，并 `router.addRoute("Root", route)` 注入到 Layout 的 children 下

### 3) Cesium Viewer 组件封装与生命周期管理（可复用资产）

- **Viewer 组件**：`src/components/Cesium/CesiumViewer.vue`
  - 负责创建容器并调用 `useCesium().initViewer(containerId, config)`
  - 通过 `map-loaded` 事件把 viewer 实例交给页面，页面只关注业务逻辑
- **Viewer Hook**：`src/hooks/useCesium.ts`
  - `shallowRef + markRaw` 保存 `Cesium.Viewer`，避免深层响应式代理导致性能问题
  - `onUnmounted` 中自动 `destroy()`，降低路由切换内存泄漏风险

### 4) i18n：路由/分类标题翻译策略

- `src/lang/utils.ts` 提供 `translateRouteTitle(title: string)`
- 约定 key：`route.${title}`，未命中则回退原值（保证“配置先行”时不阻塞开发）

---

## 目录结构（职责说明）

```text
vue3-cesium-sandcastle/
├─ docs/
│  └─ PROJECT.md                 # 本文档：项目说明与开发规范
├─ public/
│  ├─ SampleData/                # Cesium 示例模型与静态资源（本地可离线加载）
│  └─ mock/                      # 首页 Gallery 数据源（本地 mock）
├─ src/
│  ├─ api/                       # 接口封装（可用于替换 mock）
│  ├─ components/                # 通用组件（含 CesiumViewer、导航/语言等）
│  ├─ config/                    # 菜单配置（站点结构源）
│  ├─ hooks/                     # Cesium 与通用 hooks（viewer、widget 等）
│  ├─ lang/                      # 国际化（语言包/初始化/工具函数）
│  ├─ layout/                    # 布局壳层（SideBar / NavBar / AppMain）
│  ├─ plugins/                   # 插件统一注册（router/store/i18n/icons）
│  ├─ router/                    # 固定路由 + 动态路由生成
│  ├─ stores/                    # Pinia store（全局状态）
│  ├─ utils/                     # 工具函数（如 Gallery 数据转换）
│  ├─ views/                     # Cesium 示例页面（按领域分类）
│  ├─ App.vue
│  └─ main.ts
├─ vite.config.ts                # Vite 配置（含 Cesium 静态资源复制）
└─ package.json
```

---

## 示例页面开发范式（推荐写法）

在页面中统一使用 `CesiumViewer`，将 viewer 初始化、卸载销毁交给组件/Hook，页面只做“业务逻辑 + Cesium API 调用”。

推荐结构：

1. 定义 viewer 配置 `Cesium.Viewer.ConstructorOptions`
2. 通过 `@map-loaded` 获取 `viewer` 实例
3. 在回调中进行资源加载（Entity / Primitive / Tileset / Imagery 等）
4. 若注册了 Cesium 事件（如 `scene.preRender`、`screenSpaceEventHandler`、定时器），页面组件 `onUnmounted` 中务必清理（避免路由切换后报错与泄漏）

---

## 扩展流程规范（可复制步骤）

下面三套流程是“新增内容”最常见的改动点。建议按顺序执行，并使用最后的检查清单自测。

### A. 新增页面（新增一个 Cesium 示例）

目标：在 `src/views` 下新增一个 `.vue` 页面，并能通过菜单/路由访问。

#### 步骤

1. **选择归类目录**
   - 在 `src/views/<分类>/` 下新建页面文件，例如：
     - `src/views/3DModels/MyNewDemo.vue`
     - `src/views/GettingStarted/MyNewDemo.vue`

2. **创建页面文件**
   - 建议从已有页面复制骨架（例如任何使用 `<CesiumViewer />` 的页面）
   - 保持统一结构：`CesiumViewer` + `@map-loaded` 回调

3. **（如需）添加静态资源**
   - 模型/贴图/视频等建议放在 `public/SampleData/...`（详见 “C. 新增 SampleData 资源”）

4. **（可选）添加国际化文案**
   - 在 `src/lang/packages/zh-cn.js` 与 `src/lang/packages/en.js` 中补齐 `route.xxx` key（详见下文 “B. 新增菜单” 的 i18n 部分）

#### 最小自测

- 运行 `pnpm dev`，确保页面能够渲染 Cesium Viewer
- 控制台无持续报错；离开页面再进入页面不报错（验证清理逻辑）

---

### B. 新增菜单（让页面出现在左侧菜单与路由中）

目标：在 SideBar 中出现菜单项，并能匹配到对应页面组件。

#### 步骤

1. **编辑菜单配置**
   - 文件：`src/config/menu.ts`
   - 找到合适的分类节点，在 `children` 中新增条目：

```ts
{
  path: "my-new-demo",
  name: "3d-models_my-new-demo", // 必须全局唯一
  meta: { title: "3d-models_my-new-demo" },
  component: "3DModels/MyNewDemo.vue",
}
```

2. **重要约束（避免踩坑）**
   - **name 必须全局唯一**：Vue Router 以 `name` 作为唯一索引
   - **path 是路由片段**：不要以 `/` 开头
   - **component 必须能被匹配到**：
     - 实际匹配键为：`/src/views/${component}`
     - 例如 `component: "3DModels/MyNewDemo.vue"` 对应 `/src/views/3DModels/MyNewDemo.vue`

3. **（建议）补齐 i18n**
   - 文件：`src/lang/packages/zh-cn.js`、`src/lang/packages/en.js`
   - 规则：`route.${meta.title}`，例如：

```js
// zh-cn.js
export default {
  route: {
    "3d-models_my-new-demo": "我的新示例",
  },
};
```

> 未补齐也不影响功能：`translateRouteTitle()` 会回退显示 key 原文，但补齐后体验更好。

#### 最小自测

- 左侧菜单出现新条目，点击后能正确跳转
- 刷新页面后仍能访问（Hash 路由通常没问题）
- 控制台没有 `[路由生成] 未找到组件文件` 警告

---

### C. 新增 SampleData 资源（新增模型/数据到 public）

目标：新增可被页面直接访问的本地资源（用于离线/演示稳定性）。

#### 推荐规范

1. **放置位置**
   - 统一放在：`public/SampleData/`
   - 建议按类型/业务再分层，例如：
     - `public/SampleData/models/<你的模型名>/...`
     - `public/SampleData/textures/<你的纹理名>/...`
     - `public/SampleData/video/<你的视频名>/...`

2. **引用方式（约定使用 BASE_URL）**
   - 在页面中使用：

```ts
const url = import.meta.env.BASE_URL + "SampleData/models/YourModel/YourModel.glb";
```

> 注意：`BASE_URL` 末尾通常带 `/`，因此不要在拼接字符串开头再写多余的 `/`，避免出现 `//`（虽然多数情况下也能工作，但不够规范）。

3. **资源大小与组织**
   - 尽量让单个示例的资源集中在同一目录，便于迁移与清理
   - 大资源建议后续迁移到外部 CDN 或 Ion（以免仓库体积过大）

#### 最小自测

- 访问页面后资源能成功加载（Network 200）
- GitHub Pages 环境下也能加载（`BASE_URL` 子路径是否正确）

---

## 常见问题与检查清单（强烈建议每次新增后过一遍）

### 路由/菜单相关

- [ ] `menu.ts` 新增项的 `name` 是否全局唯一
- [ ] `component` 是否为相对 `src/views` 的真实路径，且大小写完全一致
- [ ] 控制台是否出现 `未找到组件文件` 的警告

### Cesium 资源与部署相关

- [ ] `window.CESIUM_BASE_URL` 是否正确（尤其 GitHub Pages 子路径）
- [ ] `VITE_CESIUM_STATIC_TARGET_URL` 是否与构建产物目录一致（默认 `cesium-static/`）
- [ ] 需要 Ion 的示例是否已配置 `VITE_CESIUM_ION_TOKEN`

### 页面资源管理（避免内存泄漏/切换报错）

- [ ] 是否在页面里注册了 Cesium 事件（如 `preRender`、`postRender`、输入事件 handler）
- [ ] 是否在 `onUnmounted` 中移除监听、清理定时器、释放引用
- [ ] 路由切换多次后是否出现性能下降或持续报错

