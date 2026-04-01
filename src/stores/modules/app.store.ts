import store from "../index";
import { SidebarStatus } from "@/enums/settings/layout-enums";
import { DeviceEnum } from "@/enums/settings/device-enum";
import { LanguageEnum } from "@/enums/settings/locale-enum";

export const useAppStore = defineStore("app", () => {
  // 语言
  const language = useStorage("app:language", LanguageEnum.ZH_CN);
  // 侧边栏状态
  const sidebarStatus = useStorage("app:sidebar_status", SidebarStatus.EXPAND);
  const isCollapse = computed(() => sidebarStatus.value === SidebarStatus.COLLAPSE);

  // 设备类型
  const device = useStorage("app:device", DeviceEnum.DESKTOP);

  // 展开/收起 侧边栏
  function toggleSidebar() {
    sidebarStatus.value =
      sidebarStatus.value === SidebarStatus.COLLAPSE
        ? SidebarStatus.EXPAND
        : SidebarStatus.COLLAPSE;
  }

  // 关闭侧边栏
  function closeSideBar() {
    sidebarStatus.value = SidebarStatus.COLLAPSE;
  }

  // 打开侧边栏
  function openSideBar() {
    sidebarStatus.value = SidebarStatus.EXPAND;
  }

  // 语言切换
  function changeLanguage(val: string) {
    language.value = val;
  }

  // 切换设备
  function toggleDevice(val: string) {
    device.value = val;
  }

  return {
    language,
    sidebarStatus,
    isCollapse,
    device,
    changeLanguage,
    toggleSidebar,
    closeSideBar,
    openSideBar,
    toggleDevice,
  };
});

export function useAppStoreHook() {
  return useAppStore(store);
}
