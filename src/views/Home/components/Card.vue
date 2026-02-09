<script setup lang="ts">
import type { galleryData } from "@/types/api/home";
import { translateRouteTitle } from "@/lang/utils";

const props = defineProps<{
  caseInfo: galleryData;
}>();
const router = useRouter();
const handleClick = () => {
  if (props.caseInfo.path) {
    router.push(props.caseInfo.path);
  }
};

const imgBaseUrl = "https://sandcastle.cesium.com/";
</script>

<template>
  <div
    class="rounded-lg bg-white shadow-sm overflow-hidden cursor-pointer transition-transform duration-300 ease-out hover:scale-105 hover:shadow-lg"
    @click="handleClick"
  >
    <div class="py-2 px-1 text-center text-sm font-medium text-gray-700 truncate">
      {{ translateRouteTitle(caseInfo.title) }}
    </div>
    <div class="w-full h-[150px] bg-gray-100">
      <img
        :src="imgBaseUrl + caseInfo.thumbnail"
        :alt="caseInfo.title"
        loading="lazy"
        class="wh-full object-cover"
      />
    </div>
  </div>
</template>

<style scoped lang="scss"></style>
