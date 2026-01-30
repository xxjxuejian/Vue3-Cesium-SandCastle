import type { App } from "vue";
import { createI18n } from "vue-i18n";
import { useAppStoreHook } from "@/stores/modules/app.store";

// 本地语言包
import zhCnLocale from "./packages/zh-cn";
import enLocale from "./packages/en";

const messages = { "zh-cn": zhCnLocale, en: enLocale };

const appStore = useAppStoreHook();

const i18n = createI18n({
  legacy: false, // 推荐在 Vue3 中使用 Composition API 模式
  globalInjection: true, // 全局注入 $t 函数
  locale: appStore.language, // 默认语言：初始化用
  fallbackLocale: "en", // 备用语言
  messages,
});

export default i18n;

// 全局注册 i18n
export function setupI18n(app: App<Element>) {
  app.use(i18n);
}
