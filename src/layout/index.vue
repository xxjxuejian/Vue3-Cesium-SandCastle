<script setup lang="ts">
import SideBar from "./components/SideBar/index.vue";
import AppMain from "./components/AppMain/index.vue";
import NavBar from "./components/NavBar/index.vue";
</script>

<template>
  <div class="layout">
    <aside class="layout_sidebar">
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
    transition: width 0.28s;

    &.hideSidebar {
      width: $sidebar-width-collapsed;
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
</style>
