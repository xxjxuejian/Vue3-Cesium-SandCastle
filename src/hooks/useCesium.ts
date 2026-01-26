import { onUnmounted, shallowRef, type Ref } from "vue";
import * as Cesium from "cesium";

// 定义 Hook 的返回类型
interface UseCesiumReturn {
  viewer: Ref<Cesium.Viewer | undefined>;
  initViewer: (containerId: string, options?: Cesium.Viewer.ConstructorOptions) => Cesium.Viewer;
}

export function useCesium(): UseCesiumReturn {
  // 使用 shallowRef 而不是 ref，因为 Cesium.Viewer 是一个巨大的复杂对象
  // 使用深层响应式(ref)会导致严重的性能问题甚至浏览器卡死
  const viewer = shallowRef<Cesium.Viewer>();

  /**
   * 初始化 Viewer
   * @param containerId DOM 元素的 ID
   * @param options Cesium Viewer 的配置项
   * 很容易想到，不同的组件中，初始化时，可能给出不同的配置项，所以需要一个配置参数
   */
  const initViewer = (containerId: string, options?: Cesium.Viewer.ConstructorOptions) => {
    // 设置默认 token (建议放到环境变量.env.local中)
    // Cesium.Ion.defaultAccessToken = 'xxx';

    const v = new Cesium.Viewer(containerId, {
      // animation: false, // 隐藏动画控件
      // timeline: false, // 隐藏时间轴
      // baseLayerPicker: false, // 隐藏底图选择器
      // fullscreenButton: false,
      // geocoder: false, // 隐藏查询控件
      // homeButton: false, // 隐藏HomeButton控件
      infoBox: false, // 禁用信息框，不然控制台报错：Blocked script execution in ‘about:blank‘ ......
      // sceneModePicker: false,
      // selectionIndicator: false,
      // navigationHelpButton: false,
      ...options, // 允许覆盖默认配置
    });

    // 隐藏版权信息（开发时可隐藏，生产环境请保留）
    // (v.cesiumWidget.creditContainer as HTMLElement).style.display = "none";

    viewer.value = v;
    return v;
  };

  // 组件销毁时自动销毁 viewer，防止内存泄漏
  // 👉 Vue 组件卸载时，Cesium 的 Viewer 不会自动被清除，必须手动销毁。
  // 而且不仅要销毁 viewer，还要清理你自己加的事件、定时器、数据源等。
  onUnmounted(() => {
    if (viewer.value && !viewer.value.isDestroyed()) {
      viewer.value.destroy();
      viewer.value = undefined;
      console.log("Cesium Viewer destroyed");
    }
  });

  return {
    viewer,
    initViewer,
  };
}
