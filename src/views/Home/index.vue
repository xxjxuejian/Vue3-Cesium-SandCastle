<script setup lang="ts">
import { getGalleryMapData } from "@/utils/transformGalleryData";
import type { galleryData } from "@/types/api/home";
import { translateRouteTitle } from "@/lang/utils";
import Card from "./components/Card.vue";
import { Search } from "@element-plus/icons-vue";

interface SelectOption {
  label: string;
  value: string | number;
}

async function getSandCastleList() {
  const res = await fetch(import.meta.env.BASE_URL + "public/mock/galleryList.json");
  const data = await res.json();
  const entries = data.entries;
  // 处理原始数据
  const dataMap = getGalleryMapData(entries);
  console.log("dataMap", dataMap);
  const keys = Object.keys(dataMap);
  // 生成select的options
  options.value = keys.map((key) => {
    return {
      label: key,
      value: key,
    };
  });
  // 保存源数据和 主页展示的数据
  originData = dataMap;
  visibleData.value = dataMap;
}

const searchValue = ref(""); // 搜索框的输入值
const selectValue = ref(""); // select选择器的选中值
let originData: Record<string, galleryData[]>; // 主页原始数据
const visibleData = shallowRef<Record<string, galleryData[]>>(); //展示的数据
const options = ref<SelectOption[]>([]); // 数据的labels选项

// 按照title的值进行匹配
const handleSearch = () => {
  // 获取输入的搜索内容
  const searchContent = searchValue.value;
  if (!searchContent) visibleData.value = originData;
  const tempObj: any = {};
  for (const key in originData) {
    const res = originData[key].filter((item) => {
      return item.title.includes(searchContent);
    });
    if (res.length > 0) {
      tempObj[key] = res;
    }
  }
  visibleData.value = tempObj;
};
// 监听select选择器的变化
const handleLabelChange = (value: string) => {
  //确保value对应的key,在originData中存在
  if (value in originData) {
    visibleData.value = { [value]: originData[value] };
  } else {
    visibleData.value = originData;
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
        style="width: 150px"
        @change="handleLabelChange"
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
      <section v-for="(value, key) in visibleData" :key="key" class="mb-4">
        <h2 class="mb-4 text-lg font-semibold text-gray-800">
          {{ translateRouteTitle(key) }}
        </h2>

        <div>
          <!-- class="w-243 mx-auto grid gap-6 grid-cols-[repeat(auto-fit,225px)]" -->
          <div class="grid gap-6 grid-cols-[repeat(auto-fit,225px)] justify-start px-4">
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
