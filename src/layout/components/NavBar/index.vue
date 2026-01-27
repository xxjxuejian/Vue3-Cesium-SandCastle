<script setup lang="ts">
import Hamburger from "@/components/Hamburger/index.vue";
</script>

<template>
  <div class="navbar">
    <div class="navbar_left">
      <Hamburger />
    </div>
    <div class="navbar_right bg-green-300">navbar_right</div>
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
