<script setup lang="ts">
import { transformGalleryDataToMap, generateHomeListData } from "@/utils/transformGalleryData";
import type { galleryData } from "@/types/api/home";
import { translateRouteTitle } from "@/lang/utils";
import Card from "./components/Card.vue";
async function getSandCastleList() {
  const res = await fetch(import.meta.env.BASE_URL + "public/mock/galleryList.json");
  const data = await res.json();
  const entries = data.entries;
  let map = transformGalleryDataToMap(entries);
  let r = generateHomeListData(map);
  homeList.value = r;
  console.log(r);
}

import { Search } from "@element-plus/icons-vue";
const searchValue = ref("");
const selectValue = ref("");
const homeList = shallowRef<Record<string, galleryData[]>>();

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

onMounted(() => {
  getSandCastleList();
});
</script>

<template>
  <div class="p-4 wh-full overflow-auto">
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
    <!-- <div class="parent">
      <el-input v-model="input" style="width: 240px" placeholder="Please input" />
    </div> -->

    <div>
      <section v-for="(value, key) in homeList" :key="key" class="mb-4">
        <h2 class="mb-4 text-lg font-semibold text-gray-800">
          {{ translateRouteTitle(key) }}
        </h2>
        <div class="grid gap-6 grid-cols-[repeat(auto-fit,minmax(225px,1fr))]">
          <Card v-for="item in value" :key="item.id" :case-info="item" />
        </div>
      </section>
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
