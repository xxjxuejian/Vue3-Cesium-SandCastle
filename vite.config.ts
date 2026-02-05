import { fileURLToPath, URL } from "node:url";
import { type ConfigEnv, type UserConfig, loadEnv, defineConfig } from "vite";

import AutoImport from "unplugin-auto-import/vite";
import Components from "unplugin-vue-components/vite";
import { ElementPlusResolver } from "unplugin-vue-components/resolvers";

import vue from "@vitejs/plugin-vue";
import vueDevTools from "vite-plugin-vue-devtools";

import UnoCSS from "unocss/vite";

// 1. 引入静态复制插件
import { viteStaticCopy } from "vite-plugin-static-copy";

// https://vite.dev/config/
export default defineConfig(({ mode }: ConfigEnv): UserConfig => {
  const env = loadEnv(mode, process.cwd());

  return {
    base: "/Vue3-Cesium-SandCastle/",
    css: {
      preprocessorOptions: {
        // 定义全局 SCSS 变量
        scss: {
          // 在 每个 .scss 文件或者组件的 <style lang="scss">  编译前，自动插入这一行代码。
          additionalData: `@use "@/styles/variables.scss" as *;`,
        },
      },
    },
    plugins: [
      vue(),
      UnoCSS(),
      vueDevTools(),
      AutoImport({
        // 导入 Vue 函数，如：ref, reactive, toRef 等
        imports: ["vue", "pinia", "vue-router", "@vueuse/core"],
        // 导入 Element Plus函数，如：ElMessage, ElMessageBox 等
        resolvers: [ElementPlusResolver()],

        eslintrc: {
          enabled: true, // 是否自动生成 eslint 规则，建议生成之后设置 false
          filepath: "./.eslintrc-auto-import.json", // 指定自动导入函数 eslint 规则的文件
          globalsPropValue: true,
        },

        vueTemplate: true,
        // 导入函数类型声明文件路径 (false:关闭自动生成)
        // dts: false,
        dts: "src/types/auto-imports.d.ts",
      }),
      Components({
        // 导入 Element Plus 组件
        resolvers: [ElementPlusResolver()],
        // 指定自定义组件位置(默认:src/components)
        dirs: ["src/components", "src/**/components"],
        // 导入组件类型声明文件路径 (false:关闭自动生成)
        // dts: false,
        dts: "src/types/components.d.ts",
      }),
      // 3. 关键配置：手动把 node_modules 里的文件复制到 dist/cesium-static
      // 注意：dest 不需要写仓库名，它会自动基于 dist 根目录
      viteStaticCopy({
        targets: [
          { src: "node_modules/cesium/Build/Cesium/*", dest: env.VITE_CESIUM_STATIC_TARGET_URL },
        ],
      }),
    ],
    resolve: {
      alias: {
        "@": fileURLToPath(new URL("./src", import.meta.url)),
      },
    },
    server: {
      // 配置代理,只有在开发模式，dev下才生效。
      proxy: {
        "/dev-api": {
          target: "https://sandcastle.cesium.com",
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/dev-api/, ""),
        },
      },
    },
  };
});
