<script setup lang="ts">
import { Search } from "@element-plus/icons-vue";
const searchValue = ref("");
const selectValue = ref("");

const options = [
  {
    value: "1",
    label: "Option 1",
  },
  {
    value: "2",
    label: "Option 2",
  },
  {
    value: "3",
    label: "Option 3",
  },
  {
    value: "4",
    label: "Option 4",
  },
  {
    value: "5",
    label: "Option 5",
  },
  {
    value: "6",
    label: "Option 6",
  },
];
</script>

<template>
  <div class="p-4">
    <!-- 按标签搜素 -->
    <div class="flex items-center gap-x-4 max-w-lg">
      <span class="font-700 text-xl">Gallery</span>
      <el-input v-model="searchValue" placeholder="Search gallery" :prefix-icon="Search" />
      <el-select v-model="selectValue" placeholder="Select" style="width: 240px">
        <el-option
          v-for="item in options"
          :key="item.value"
          :label="item.label"
          :value="item.value"
        />
      </el-select>
    </div>

    <!-- 主内容 -->
    <div></div>
  </div>
</template>
