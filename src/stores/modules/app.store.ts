import store from "../index";

export const useAppStore = defineStore("app", () => {
  // 语言
  const language = useStorage("app:language", "zh-cn");
  // 侧边栏状态
  const sidebarStatus = useStorage("app:sidebar_status", "expand");
  const isCollapse = computed(() => sidebarStatus.value === "collapse");

  // 展开/收起 侧边栏
  function toggleSidebar() {
    sidebarStatus.value = sidebarStatus.value === "collapse" ? "expand" : "collapse";
  }

  // 语言切换
  function changeLanguage(val: string) {
    language.value = val;
  }

  return { language, sidebarStatus, isCollapse, toggleSidebar, changeLanguage };
});

export function useAppStoreHook() {
  return useAppStore(store);
}
