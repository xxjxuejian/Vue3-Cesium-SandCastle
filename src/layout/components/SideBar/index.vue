<script setup lang="ts">
import SideBarLogo from "./components/SideBarLogo.vue";
import SideBarMenu from "./components/SideBarMenu.vue";
</script>

<template>
  <div class="h-full">
    <SideBarLogo />
    <el-scrollbar class="menu-scrollbar">
      <SideBarMenu />
    </el-scrollbar>
  </div>
</template>

<style scoped lang="scss">
.menu-scrollbar {
  max-height: calc(100% - $navbar-height);
}
</style>
