<script setup lang="ts">
import Hamburger from "@/components/Hamburger/index.vue";
import NavBarRight from "./components/NavBarRight.vue";
</script>

<template>
  <div class="navbar">
    <!-- 左侧 -->
    <div class="navbar_left bg-red-100">
      <Hamburger />
    </div>
    <!-- 右侧 -->
    <div class="navbar_right h-full">
      <NavBarRight />
    </div>
  </div>
</template>

<style scoped lang="scss">
.navbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: $navbar-height;
  padding: 0 20px;
  background: var(--el-bg-color);
}
</style>
