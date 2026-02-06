<script setup lang="ts">
import { getSandCastleListApi } from "@/api/home";

function getSandCastleList() {
  getSandCastleListApi().then((res) => {
    console.log("list data", res);
  });
}
// getSandCastleList();

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

const input = ref("");
</script>

<template>
  <div class="p-4">
    <!-- 按标签搜索-->
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
    <div class="parent">
      <el-input v-model="input" style="width: 240px" placeholder="Please input" />
    </div>
  </div>
</template>

<style lang="scss" scoped>
/* .parent {
  .el-input {
    border: 1px solid red;
  }
} */

.parent {
  .el-input {
    :deep(.el-input__inner) {
      background-color: blueviolet;
    }
  }
}
</style>
