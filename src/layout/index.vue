<script setup lang="ts">
import SideBar from "./components/SideBar/index.vue";
import AppMain from "./components/AppMain/index.vue";
import NavBar from "./components/NavBar/index.vue";
import { useAppStore } from "@/stores/modules/app.store";
import { useDeviceDetection } from "@/hooks/useDeviceDetection";

const appStore = useAppStore();

/// Device detection for responsive layout
const { isMobile } = useDeviceDetection();

const handleCloseOverlay = () => {
  appStore.closeSideBar();
};
</script>

<template>
  <div class="layout">
    <!-- 移动端遮罩 -->
    <div
      v-if="isMobile && !appStore.isCollapse"
      class="mobile__overlay"
      @click="handleCloseOverlay"
    ></div>

    <aside
      class="layout_sidebar"
      :class="{
        hideSidebar: appStore.isCollapse,
        mobile: isMobile,
      }"
    >
      <SideBar></SideBar>
    </aside>

    <div class="layout_main">
      <div class="layout_navbar">
        <NavBar></NavBar>
      </div>
      <div class="layout_content">
        <AppMain></AppMain>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.layout {
  display: flex;
  width: 100%;
  height: 100%;

  // 侧边栏
  .layout_sidebar {
    width: $sidebar-width;
    height: 100%;
    background-color: rgb(255, 255, 255);
    transition: width 0.28s;

    &.hideSidebar {
      width: $sidebar-width-collapsed;
    }
    // 移动端侧边栏覆盖在内容上
    &.mobile {
      position: fixed;
      top: 0;
      bottom: 0;
      left: 0;
      z-index: 999;

      &.hideSidebar {
        width: 0;
        overflow: hidden;
      }
    }
  }

  // 主体
  .layout_main {
    flex: 1;
    height: 100%;
    overflow: hidden;

    // 顶部导航栏
    .layout_navbar {
      width: 100%;
      height: $navbar-height;
    }

    // 内容区域
    .layout_content {
      width: 100%;
      height: calc(100% - $navbar-height);
    }
  }
}

.mobile__overlay {
  position: fixed;
  top: 0;
  left: 0;
  z-index: 999;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.4);
}
</style>
