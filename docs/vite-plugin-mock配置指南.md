# vite-plugin-mock 配置指南

本文档基于当前项目安装的 `vite-plugin-mock@3.0.2` 编写。

## 当前结论

当前版本不要使用旧版教程里的这些配置：

```ts
prodEnabled: true
injectCode: "..."
```

`vite-plugin-mock@3.0.2` 的类型定义中没有这些选项。

本项目采用两套机制：

- 开发环境：通过 Vite dev server 中间件拦截接口。
- 生产环境：通过 `mockjs` 在浏览器端拦截请求。

## 目录约定

mock 文件放在根目录 `mock/` 下：

```txt
mock/
  home.mock.ts
  menu.mock.ts
```

每个 mock 文件默认导出接口数组：

```ts
import type { MockMethod } from "vite-plugin-mock";

export default [
  {
    url: "/api/example/list",
    method: "get",
    response: () => {
      return {
        code: 200,
        data: [],
        msg: "success",
      };
    },
  },
] as MockMethod[];
```

字段说明：

- `url`：需要拦截的请求地址。
- `method`：请求方法，支持 `get`、`post`、`put`、`delete`、`patch`。
- `response`：返回 mock 数据。
- `timeout`：可选，模拟接口延迟。
- `statusCode`：可选，模拟 HTTP 状态码。

## 开发环境配置

开发环境在 `vite.config.ts` 中配置：

```ts
import { viteMockServe } from "vite-plugin-mock";

export default defineConfig(({ command, mode }: ConfigEnv): UserConfig => {
  return {
    plugins: [
      viteMockServe({
        mockPath: "mock",
        enable: command === "serve",
        logger: true,
      }),
    ],
  };
});
```

配置说明：

- `mockPath: "mock"`：读取根目录下的 `mock/` 文件。
- `enable: command === "serve"`：只在 `pnpm dev` 时启用开发 mock 中间件。
- `logger: true`：请求命中 mock 时在终端输出日志。

为什么开发环境要用 `command === "serve"`：

- `pnpm dev` 时 `command` 是 `serve`。
- `pnpm build` 时 `command` 是 `build`。
- 开发 mock 中间件只适合 Vite dev server，不适合生产构建。

## 生产环境配置

生产环境不能依赖 Vite dev server 中间件，因为 GitHub Pages 只是静态站点，没有后端服务。

当前项目通过 `src/mockProdServer.ts` 注册生产 mock：

```ts
import { createProdMockServer } from "vite-plugin-mock/client";

const modules = import.meta.glob("../mock/**/*.ts", { eager: true });

const mockModules = Object.values(modules).flatMap((module) => {
  const mod = module as { default?: unknown };
  const mockData = mod.default ?? module;

  return Array.isArray(mockData) ? mockData : [mockData];
});

export async function setupProdMockServer() {
  await createProdMockServer(mockModules);
}
```

然后在 `src/main.ts` 中生产环境启动前注册：

```ts
async function bootstrap() {
  if (import.meta.env.PROD) {
    const { setupProdMockServer } = await import("./mockProdServer");
    await setupProdMockServer();
  }

  const app = createApp(App);
  app.use(setupPlugins);
  app.mount("#app");
}

bootstrap();
```

配置说明：

- `import.meta.env.PROD`：只在生产构建中启用。
- `import.meta.glob("../mock/**/*.ts", { eager: true })`：构建时收集所有 mock 文件。
- `createProdMockServer(mockModules)`：使用 `mockjs` 在浏览器端拦截请求。

## 请求写法

业务接口保持正常写法即可：

```ts
import request from "@/utils/request";

export function getGalleryList() {
  return request({
    url: "/api/gallery/list",
    method: "get",
  });
}
```

只要 `mock/home.mock.ts` 中存在同样的 `url` 和 `method`，开发和生产都会返回 mock 数据。

## 开发环境和生产环境的区别

| 环境 | 启动方式 | mock 生效方式 | 运行位置 |
| --- | --- | --- | --- |
| 开发环境 | `pnpm dev` | Vite dev server 中间件 | Node 服务端 |
| 生产构建 | `pnpm build` | 打包 mock 注册代码 | 浏览器端 |
| 生产预览 | `pnpm preview` | 浏览器端 `mockjs` 拦截 | 浏览器端 |
| GitHub Pages | GitHub Actions 构建后部署 | 浏览器端 `mockjs` 拦截 | 浏览器端 |

## 验证方式

### 开发环境验证

运行：

```bash
pnpm dev
```

打开页面后，观察终端是否出现 mock 请求日志。

也可以在浏览器控制台或 Network 面板确认接口返回内容。

### 生产环境验证

先构建：

```bash
pnpm build
```

再预览：

```bash
pnpm preview
```

打开生产预览地址，确认页面接口能正常返回 mock 数据。

当前首页示例中，`/api/gallery/list` 命中后会拿到 `mock/home.mock.ts` 的数据。

## 新增 mock 接口步骤

### 1. 添加 mock 文件

可以新建：

```txt
mock/example.mock.ts
```

内容示例：

```ts
import type { MockMethod } from "vite-plugin-mock";

export default [
  {
    url: "/api/example/detail",
    method: "get",
    response: ({ query }) => {
      return {
        code: 200,
        data: {
          id: query.id,
          name: "example",
        },
        msg: "success",
      };
    },
  },
] as MockMethod[];
```

### 2. 添加 API 方法

```ts
import request from "@/utils/request";

export function getExampleDetail(id: string) {
  return request({
    url: "/api/example/detail",
    method: "get",
    params: { id },
  });
}
```

### 3. 页面中调用

```ts
const res = await getExampleDetail("1");
console.log(res.data);
```

### 4. 验证开发和生产

分别运行：

```bash
pnpm dev
pnpm build
pnpm preview
```

确认两种环境都能拿到数据。

## 常见问题

### 为什么生产环境也要 mock

本项目部署到 GitHub Pages，GitHub Pages 只能托管静态文件，不能提供后端 API。

如果首页、菜单或示例列表依赖 `/api/...`，就需要在生产包里也注册 mock。

### 为什么生产环境看不到真实网络请求

生产 mock 是在浏览器端由 `mockjs` 拦截 `XMLHttpRequest`。

接口请求可能不会像真实后端请求一样出现在 Network 面板中，或者表现和真实 HTTP 请求不同。

建议结合页面状态、控制台日志和业务返回值确认。

### 为什么 fetch 请求不生效

`vite-plugin-mock/client` 依赖 `mockjs`，主要拦截 `XMLHttpRequest`。

当前项目的 `request` 基于 `axios`，浏览器环境下默认走 `XMLHttpRequest`，所以可以生效。

如果后续改成原生 `fetch`，生产 mock 可能不会拦截，需要重新评估 mock 方案。

### 为什么接口没有命中

优先检查：

- 业务请求的 `url` 和 mock 的 `url` 是否一致。
- 请求方法是否一致，例如都是 `get`。
- mock 文件是否默认导出数组。
- mock 文件是否位于根目录 `mock/` 下。
- 生产环境是否执行了 `setupProdMockServer()`。

### 为什么不要把 `enable` 一直设为 `true`

开发服务和生产构建的 mock 机制不同。

当前项目让 `viteMockServe` 只服务开发环境：

```ts
enable: command === "serve"
```

生产环境由 `src/mockProdServer.ts` 负责注册。这样职责更清晰，也更符合当前版本插件的能力。

## 注意事项

- 生产 mock 会把 mock 数据打进前端产物，数据不应包含敏感信息。
- 大体积 mock 数据会增加构建产物大小。
- mock 接口适合演示和静态部署，不等同于真实后端权限校验。
- 如果以后接入真实后端，建议通过环境变量控制是否启用生产 mock。
- 如果 mock 中包含随机数据，生产环境每次刷新可能返回不同结果，需要确认是否符合页面预期。

## 可选改造：用环境变量控制生产 mock

如果以后需要在部分生产环境关闭 mock，可以增加环境变量：

```env
VITE_USE_PROD_MOCK=true
```

然后修改 `src/main.ts`：

```ts
if (import.meta.env.PROD && import.meta.env.VITE_USE_PROD_MOCK === "true") {
  const { setupProdMockServer } = await import("./mockProdServer");
  await setupProdMockServer();
}
```

这样同一套代码可以支持：

- GitHub Pages 演示环境启用 mock。
- 有真实后端的生产环境关闭 mock。
