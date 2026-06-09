# 菜单和路由规则

## 路由生成机制

项目通过 `src/config/menu.ts` 定义菜单树，再由 `src/router/generator.ts` 动态生成路由。

`component` 字段是相对 `src/views` 的路径，例如：

```ts
component: "ShowCases/Google2DTiles.vue"
```

路由生成器会拼成：

```ts
/src/views/ShowCases/Google2DTiles.vue
```

因此大小写、目录和文件名必须完全匹配。

## 新增页面菜单项

新增一个示例时，通常在对应分类的 `children` 中加入：

```ts
{
  path: "demo-path",
  name: "category_demo-path",
  meta: { title: "category_demo-path" },
  component: "Category/DemoFile.vue",
}
```

规则：

- `path` 使用小写短横线。
- `name` 必须全局唯一，推荐使用分类前缀。
- `meta.title` 使用项目已有 i18n key 风格。
- `component` 使用相对 `src/views` 的真实路径。

## 国际化配置

新增或修改菜单项后，必须同步维护路由标题的中英文文案：

- 中文：`src/lang/packages/zh-cn.js`
- 英文：`src/lang/packages/en.js`

文案写在默认导出的 `route` 对象中，key 必须与 `menu.ts` 中的 `meta.title` 完全一致。例如：

```ts
// src/config/menu.ts
{
  path: "demo-path",
  name: "category_demo-path",
  meta: { title: "category_demo-path" },
  component: "Category/DemoFile.vue",
}
```

需要同步补充：

```js
// src/lang/packages/zh-cn.js
"category_demo-path": "中文页面标题",

// src/lang/packages/en.js
"category_demo-path": "English Page Title",
```

如果新增顶级分类，也要为顶级分类的 `meta.title` 补充中英文文案。

## 分类不存在时

如果目标 Sandcastle 分类在 `menu.ts` 中不存在，先新增顶级分类：

```ts
{
  path: "new-category",
  name: "new-category",
  meta: { title: "new-category", icon: "el-icon-Collection" },
  redirect: "/new-category/first-demo",
  children: [],
}
```
顶级分类的图标采用element-plus图标库，格式为`icon: "el-icon-Collection"`,其中
Collection为图标名称,从 [element-plus图标库](https://element-plus.org/zh-CN/component/icon) 中选择一个比较合适的即可。
顶级分类没有 `component` 时，路由生成器会自动使用 `ParentView` 作为容器。

## 修改 redirect

只有当新增页面应该作为分类默认页时，才修改分类的 `redirect`。否则保持现有默认页。
