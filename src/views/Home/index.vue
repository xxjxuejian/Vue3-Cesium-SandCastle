<script setup lang="ts">
import { transformGalleryDataToMap, generateHomeListData } from "@/utils/transformGalleryData";
import type { galleryData } from "@/types/api/home";
import { translateRouteTitle } from "@/lang/utils";
import Card from "./components/Card.vue";

interface SelectOption {
  label: string;
  value: string | number;
}

async function getSandCastleList() {
  const res = await fetch(import.meta.env.BASE_URL + "public/mock/galleryList.json");
  const data = await res.json();
  const entries = data.entries;
  let map = transformGalleryDataToMap(entries);
  let r = generateHomeListData(map);
  const keys = Object.keys(r);
  // 生成select的options
  options.value = keys.map((key) => {
    return {
      label: key,
      value: key,
    };
  });
  // 保存源数据和 主页展示的数据
  originData = r;
  homeData.value = r;
  console.log(r);
}

import { Search } from "@element-plus/icons-vue";
const searchValue = ref(""); // 搜索框的输入值
const selectValue = ref(""); // select选择器的选中值
let originData: Record<string, galleryData[]>; // 主页原始数据
const homeData = shallowRef<Record<string, galleryData[]>>(); //展示的数据
const options = ref<SelectOption[]>([]); // 数据的labels选项

// 按照title的值进行匹配
const handleSearch = () => {
  // 获取输入的搜索内容
  const searchContent = searchValue.value;
  if (!searchContent) homeData.value = originData;
  const tempObj: any = {};
  for (const key in originData) {
    const res = originData[key].filter((item) => {
      return item.title.includes(searchContent);
    });
    if (res.length > 0) {
      tempObj[key] = res;
    }
  }
  homeData.value = tempObj;
};
// 监听select选择器的变化
const handleLabelChange = (value: string) => {
  //确保value对应的key,在originData中存在
  if (value in originData) {
    homeData.value = { [value]: originData[value] };
  } else {
    homeData.value = originData;
  }
};

onMounted(() => {
  getSandCastleList();
});
</script>

<template>
  <div class="p-4 wh-full overflow-auto">
    <!-- 按标签搜索-->
    <div class="flex items-center gap-x-4">
      <span class="font-700 text-xl">Gallery</span>
      <el-input
        v-model="searchValue"
        placeholder="Search gallery"
        clearable
        :prefix-icon="Search"
        style="width: 240px"
      />

      <el-button type="primary" @click="handleSearch">Search</el-button>

      <el-select
        v-model="selectValue"
        placeholder="Labels"
        @change="handleLabelChange"
        style="width: 100px"
      >
        <el-option label="All" value="all" />
        <el-option
          v-for="item in options"
          :key="item.value"
          :label="item.label"
          :value="item.value"
        />
      </el-select>
    </div>

    <!-- 主内容 -->
    <div>
      <section v-for="(value, key) in homeData" :key="key" class="mb-4">
        <h2 class="mb-4 text-lg font-semibold text-gray-800">
          {{ translateRouteTitle(key) }}
        </h2>
        <!-- class="grid gap-6 grid-cols-[repeat(auto-fit,minmax(225px,250px))] bg-red-100" -->
        <div>
          <div class="w-243 mx-auto bg-green-100 grid gap-6 grid-cols-[repeat(auto-fit,225px)]">
            <Card v-for="item in value" :key="item.id" :case-info="item" />
          </div>
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
