import store from "../index";

export const useAppStore = defineStore("app", () => {
  // 语言
  const language = ref("zh-cn");
  // 侧边栏状态
  const sidebarStatus = ref("expand");
  const isCollapse = computed(() => sidebarStatus.value === "collapse");

  function toggleSidebar() {
    sidebarStatus.value = sidebarStatus.value === "collapse" ? "expand" : "collapse";
  }

  return { language, sidebarStatus, isCollapse, toggleSidebar };
});

export function useAppStoreHook() {
  return useAppStore(store);
}
