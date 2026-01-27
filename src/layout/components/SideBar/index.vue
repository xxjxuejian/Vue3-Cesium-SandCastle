<script setup lang="ts">
import SideBarLogo from "./components/SideBarLogo.vue";
import SideBarMenu from "./components/SideBarMenu.vue";
</script>

<template>
  <div>
    <SideBarLogo />
    <el-scrollbar>
      <SideBarMenu />
    </el-scrollbar>
  </div>
</template>

<style scoped lang="scss"></style>
