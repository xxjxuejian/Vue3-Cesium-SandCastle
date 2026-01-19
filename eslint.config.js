import globals from "globals"; // 全局变量
import js from "@eslint/js"; // JavaScript 规则

// TypeScript支持
import * as typescriptEslint from "typescript-eslint";

// Vue支持
import pluginVue from "eslint-plugin-vue"; // Vue 规则
import vueParser from "vue-eslint-parser"; // Vue 解析器

// 代码风格与格式化
import configPrettier from "eslint-config-prettier"; // 禁用与 Prettier 冲突的规则
import prettierPlugin from "eslint-plugin-prettier"; // 运行 Prettier 规则

import { defineConfig } from "eslint/config";

// 解析自动导入配置
import fs from "fs";
let autoImportGlobals = {};
try {
  autoImportGlobals =
    JSON.parse(fs.readFileSync("./.eslintrc-auto-import.json", "utf-8")).globals || {};
} catch (error) {
  // 文件不存在或解析错误时使用空对象
  console.warn("Could not load auto-import globals", error);
}

// Element Plus组件
const elementPlusComponents = {
  // Element Plus 组件添加为全局变量，避免 no-undef 报错
  ElInput: "readonly",
  ElSelect: "readonly",
  ElSwitch: "readonly",
  ElCascader: "readonly",
  ElInputNumber: "readonly",
  ElTimePicker: "readonly",
  ElTimeSelect: "readonly",
  ElDatePicker: "readonly",
  ElTreeSelect: "readonly",
  ElText: "readonly",
  ElRadioGroup: "readonly",
  ElCheckboxGroup: "readonly",
  ElOption: "readonly",
  ElRadio: "readonly",
  ElCheckbox: "readonly",
  ElInputTag: "readonly",
  ElForm: "readonly",
  ElFormItem: "readonly",
  ElTable: "readonly",
  ElTableColumn: "readonly",
  ElButton: "readonly",
  ElDialog: "readonly",
  ElPagination: "readonly",
  ElMessage: "readonly",
  ElMessageBox: "readonly",
  ElNotification: "readonly",
  ElTree: "readonly",
};

export default defineConfig([
  // 忽略文件配置
  {
    ignores: [
      "**/node_modules/**",
      "**/dist/**",
      "**/*.min.*",
      "**/auto-imports.d.ts",
      "**/components.d.ts",
    ],
  },
  // 基础 JavaScript 配置
  js.configs.recommended,

  // Vue 推荐配置
  ...pluginVue.configs["flat/recommended"],

  // TypeScript 推荐配置
  ...typescriptEslint.configs.recommended,

  // 全局配置
  {
    // 指定要检查的文件
    files: ["**/*.{js,mjs,cjs,ts,mts,cts,vue}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.browser, // 浏览器环境全局变量
        ...globals.node, // Node.js 环境全局变量
        ...globals.es2022, // ES2022 全局对象
        ...autoImportGlobals, // 自动导入的 API 函数
        ...elementPlusComponents, // Element Plus 组件
        // 全局类型定义，解决 TypeScript 中定义但 ESLint 不识别的问题, 示例用，请根据实际项目调整
        // ApiResponse: "readonly",
        // __APP_INFO__: "readonly",
      },
    },
    plugins: {
      vue: pluginVue,
      "@typescript-eslint": typescriptEslint.plugin,
    },
    rules: {
      // 基础规则
      "no-console": process.env.NODE_ENV === "production" ? "warn" : "off",
      "no-debugger": process.env.NODE_ENV === "production" ? "warn" : "off",

      // ES6+ 规则
      "prefer-const": "error",
      "no-var": "error",
      "object-shorthand": "error",

      // 最佳实践
      eqeqeq: "off",
      "no-multi-spaces": "error",
      "no-multiple-empty-lines": ["error", { max: 1, maxBOF: 0, maxEOF: 0 }],

      // 禁用与 TypeScript 冲突的规则
      "no-unused-vars": "off",
      "no-undef": "off",
      "no-redeclare": "off",
      "@typescript-eslint/ban-ts-comment": "off",
    },
  },

  // Vue 文件特定配置
  {
    files: ["**/*.vue"],
    languageOptions: {
      parser: vueParser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        parser: typescriptEslint.parser,
        // extraFileExtensions: [".vue"],
        // tsconfigRootDir: __dirname,
      },
    },
    rules: {
      // Vue 规则
      "vue/multi-word-component-names": "off", // 允许使用驼峰命名
      "vue/no-v-html": "off", // 允许使用 v-html，注意 XSS 风险
      "vue/require-default-prop": "off", // 允许不设置 props 默认值
      "vue/require-explicit-emits": "error", // 强制定义 emits:组件中显式声明所有可能 $emit 的事件
      "vue/no-unused-vars": "error", //不允许未使用变量
      "vue/no-mutating-props": "off", // 允许直接修改 props
      "vue/valid-v-for": "warn", // 检查 v-for 指令的语法
      "vue/no-template-shadow": "warn", //禁止在模板中声明的变量名和外层作用域的变量名重名，否则警告。
      "vue/return-in-computed-property": "warn", //computed 计算属性中必须 return，否则警告。
      // 强制 <script>, <template>, <style> 的顺序。这个顺序我感觉比较合理
      "vue/block-order": [
        "error",
        {
          order: ["script", "template", "style"],
        },
      ],
      // 强制自闭合标签
      "vue/html-self-closing": [
        "error",
        {
          html: {
            void: "always", //html的空元素标签必须自闭合，如 <br />，<img/>
            normal: "never", //html的普通元素标签必须没有自闭合，如 <p></p>
            component: "always", //组件没有内容，必须自闭合,如 <MyComponent />；组件内部有内容（有插槽或子元素）<MyComp></MyComp> 是 允许的，
          },
          svg: "always",
          math: "always",
        },
      ],
      // 模板中使用组件名必须是大驼峰写法（<MyComponent />），而不是 <my-component />。
      "vue/component-name-in-template-casing": ["error", "PascalCase"],
      // （允许 any）。
      "@typescript-eslint/no-explicit-any": "off",
      "vue/max-attributes-per-line": "off",
    },
  },

  // TypeScript 文件特定配置
  {
    files: ["**/*.{ts,tsx,mts,cts}"],
    languageOptions: {
      parser: typescriptEslint.parser,
      parserOptions: {
        ecmaVersion: "latest",
        // sourceType: "module",
        // project: "./tsconfig.json",
        // tsconfigRootDir: __dirname,
      },
    },
    rules: {
      // TypeScript 规则
      "@typescript-eslint/no-explicit-any": "off", // 允许使用any类型，方便开发
      "@typescript-eslint/no-empty-function": "off",
      "@typescript-eslint/no-empty-object-type": "off",
      "@typescript-eslint/ban-ts-comment": "off",
      "@typescript-eslint/no-non-null-assertion": "off",
      "@typescript-eslint/no-unused-vars": "warn", // 降级为警告
      "@typescript-eslint/no-unused-expressions": "warn", // 降级为警告
      "@typescript-eslint/consistent-type-imports": "off", // 关闭强制使用type import
      "@typescript-eslint/no-import-type-side-effects": "error",
    },
  },

  // .d.ts 文件配置
  {
    files: ["**/*.d.ts"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": "off",
    },
  },

  // Prettier 集成（必须放在最后）
  {
    plugins: {
      prettier: prettierPlugin, // 将 Prettier 的输出作为 ESLint 的问题来报告
    },
    rules: {
      ...configPrettier.rules,
      "prettier/prettier": ["error", {}, { usePrettierrc: true }],
      "arrow-body-style": "off",
      "prefer-arrow-callback": "off",
    },
  },
]);
