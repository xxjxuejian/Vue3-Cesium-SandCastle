# 安全 Token 配置指南

本文档说明后续如何在本地开发和 GitHub Actions 生产部署中添加新的安全 Token。

## 适用场景

适用于这类需要前端在运行时使用的第三方 Token：

- Cesium Ion Token
- 天地图 Token
- 其他地图、影像、数据服务访问 Token

当前项目已经使用：

- `VITE_CESIUM_ION_TOKEN`
- `VITE_TIANDITU_TOKEN`

## 核心原则

前端项目里的 `import.meta.env` 变量是在构建时注入的。

也就是说：

- 本地开发读取的是本机 `.env.local` 等环境文件。
- GitHub Pages 生产环境读取的是 GitHub Actions 构建时传入的环境变量。
- GitHub Actions 不会读取你本机的 `.env.local`。
- 变量名必须以 `VITE_` 开头，否则 Vite 不会暴露给前端代码。

## 添加步骤

### 1. 确定变量名

统一使用 `VITE_` 前缀，并用清晰的服务名命名。

示例：

```txt
VITE_EXAMPLE_MAP_TOKEN
```

命名建议：

- 使用全大写字母。
- 单词之间用下划线。
- 能看出服务来源和用途。
- 不要使用过于宽泛的名字，例如 `VITE_TOKEN`。

## 2. 配置本地环境变量

在根目录 `.env.local` 中添加：

```env
VITE_EXAMPLE_MAP_TOKEN=你的本地Token
```

注意：

- `.env.local` 不应该提交到仓库。
- 当前 `.gitignore` 已经通过 `*.local` 忽略这类文件。
- 不要把真实 Token 写进 `.env.production`、`.env.development` 或源码文件。

## 3. 在代码中读取

在 Vue、TypeScript 或工具模块中读取：

```ts
const token = import.meta.env.VITE_EXAMPLE_MAP_TOKEN;
```

如果该 Token 是可选能力，建议做缺失判断：

```ts
const token = import.meta.env.VITE_EXAMPLE_MAP_TOKEN;

if (!token) {
  console.warn("请配置 VITE_EXAMPLE_MAP_TOKEN 后再使用对应服务。");
}
```

当前项目示例：

```ts
tiandituToken: import.meta.env.VITE_TIANDITU_TOKEN,
```

## 4. 配置 GitHub Repository Secret

进入 GitHub 仓库页面：

```txt
Settings -> Secrets and variables -> Actions -> Repository secrets -> New repository secret
```

新增 Secret：

```txt
Name: VITE_EXAMPLE_MAP_TOKEN
Secret: 真实生产Token
```

注意：

- `Name` 必须和代码、workflow 中的变量名完全一致。
- 大小写必须一致。
- 如果 workflow 使用 `secrets.xxx`，就要添加到 `Repository secrets`。
- 不要误添加到 `Repository variables`，除非 workflow 使用的是 `vars.xxx`。

## 5. 在 GitHub Actions 中注入变量

修改 `.github/workflows/deploy.yml`，在 `build` job 的 `env` 中添加：

```yaml
jobs:
  build:
    runs-on: ubuntu-latest
    env:
      VITE_CESIUM_ION_TOKEN: ${{ secrets.VITE_CESIUM_ION_TOKEN }}
      VITE_TIANDITU_TOKEN: ${{ secrets.VITE_TIANDITU_TOKEN }}
      VITE_EXAMPLE_MAP_TOKEN: ${{ secrets.VITE_EXAMPLE_MAP_TOKEN }}
```

这样 `pnpm run build` 时，Vite 才能把变量写入生产构建产物。

## 6. 重新部署

提交并推送代码后，GitHub Actions 会重新构建：

```bash
git add .github/workflows/deploy.yml
git commit -m "Add example map token to deploy workflow"
git push
```

也可以在 GitHub Actions 页面手动 rerun workflow。

## 验证方式

### 本地验证

确认 `.env.local` 已配置后运行：

```bash
pnpm dev
```

打开需要该 Token 的页面，检查服务是否正常加载。

### 生产验证

生产部署完成后：

1. 打开 GitHub Pages 页面。
2. 进入使用该 Token 的功能页面。
3. 检查地图、影像或数据服务是否正常加载。
4. 打开浏览器控制台，确认没有 Token 缺失警告或第三方服务鉴权错误。

## 常见问题

### VS Code 提示 Context access might be invalid

如果看到类似提示：

```txt
Context access might be invalid: VITE_EXAMPLE_MAP_TOKEN
```

通常是编辑器的 GitHub Actions 插件无法确认远程仓库是否存在这个 Secret。

只要 GitHub 仓库的 `Repository secrets` 中存在同名 Secret，workflow 运行时就是有效的。

### 本地能用，线上不能用

优先检查：

- GitHub 仓库是否添加了同名 Secret。
- `.github/workflows/deploy.yml` 是否把该 Secret 注入到了 `env`。
- 变量名是否以 `VITE_` 开头。
- GitHub Actions 是否在添加 Secret 后重新运行过。
- 第三方服务是否限制了域名、来源或访问配额。

### Secret 已添加，但代码里仍然是 undefined

常见原因：

- 变量名拼写不一致。
- workflow 中没有传入该变量。
- 变量没有 `VITE_` 前缀。
- 修改 Secret 后没有重新构建生产包。

## 安全注意事项

- 不要提交 `.env.local`。
- 不要把真实 Token 写进源码、文档示例或构建产物。
- 不要把生产 Token 写进 issue、PR 评论、截图或日志。
- 第三方平台如果支持域名白名单，应限制为本地开发域名和 GitHub Pages 域名。
- 第三方平台如果支持权限范围，应只授予当前功能需要的最小权限。
- 如果 Token 泄露，应立即在第三方平台重置，并更新 GitHub Secret。
- 注意前端 Token 最终会进入浏览器产物，不能用于真正需要保密的后端密钥。

## 推荐清单

每次新增 Token 时按下面清单检查：

- 已确认变量名，例如 `VITE_EXAMPLE_MAP_TOKEN`。
- 已在 `.env.local` 配置本地值。
- 已在代码中通过 `import.meta.env.VITE_EXAMPLE_MAP_TOKEN` 读取。
- 已在 GitHub `Repository secrets` 添加同名 Secret。
- 已在 `.github/workflows/deploy.yml` 的 `build.env` 中注入。
- 已重新运行 GitHub Actions。
- 已验证本地和生产页面都能正常加载。
- 已确认真实 Token 没有被提交到仓库。
