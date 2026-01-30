import type { App } from "vue";

import { setupRouter } from "@/router";
import { setupStore } from "@/stores";
import { setupElIcons } from "./el-icon";
import { setupI18n } from "@/lang";

export default {
  install(app: App<Element>) {
    // // 自定义指令(directive)
    // setupDirective(app)
    // 路由(router)
    setupRouter(app);
    // 状态管理(store)
    setupStore(app);
    // Element-plus图标
    setupElIcons(app);
    // // 路由守卫
    // setupPermission()
    // 国际化
    setupI18n(app);
  },
};
