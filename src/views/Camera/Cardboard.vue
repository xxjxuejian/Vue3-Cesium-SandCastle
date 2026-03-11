<script setup lang="ts">
import CesiumViewer from "@/components/Cesium/CesiumViewer.vue";
import * as Cesium from "cesium";

const viewerConfig: Cesium.Viewer.ConstructorOptions = {
  vrButton: true,
  terrain: Cesium.Terrain.fromWorldTerrain(),
};

const start = Cesium.JulianDate.fromDate(new Date(2015, 2, 25, 16));
const stop = Cesium.JulianDate.addSeconds(start, 360, new Cesium.JulianDate());
let entity: Cesium.Entity | undefined = undefined;
const longitude: number = -112.110693;
const latitude: number = 36.0994841;
const radius: number = 0.03;
const modelURI = import.meta.env.BASE_URL + "SampleData/models/CesiumBalloon/CesiumBalloon.glb";

function computeCirclularFlight(
  lon: number,
  lat: number,
  radius: number
): Cesium.SampledPositionProperty {
  const property = new Cesium.SampledPositionProperty();
  const startAngle = Cesium.Math.nextRandomNumber() * 360.0;
  const endAngle = startAngle + 360.0;

  const increment = (Cesium.Math.nextRandomNumber() * 2.0 - 1.0) * 10.0 + 45.0;
  for (let i = startAngle; i < endAngle; i += increment) {
    const radians = Cesium.Math.toRadians(i);
    const timeIncrement = i - startAngle;
    const time = Cesium.JulianDate.addSeconds(start, timeIncrement, new Cesium.JulianDate());
    const position = Cesium.Cartesian3.fromDegrees(
      lon + radius * 1.5 * Math.cos(radians),
      lat + radius * Math.sin(radians),
      Cesium.Math.nextRandomNumber() * 500 + 1800
    );
    property.addSample(time, position);
  }
  return property;
}
const handleMapLoaded = (viewer: Cesium.Viewer) => {
  viewer.scene.globe.enableLighting = true;
  viewer.scene.globe.depthTestAgainstTerrain = true;

  // Follow the path of a plane. See the interpolation Sandcastle example.
  Cesium.Math.setRandomNumberSeed(3);

  viewer.clock.startTime = start.clone();
  viewer.clock.stopTime = stop.clone();
  viewer.clock.currentTime = start.clone();
  viewer.clock.clockRange = Cesium.ClockRange.LOOP_STOP;
  viewer.clock.multiplier = 1.0;
  viewer.clock.shouldAnimate = true;

  loadModel(viewer);

  const camera = viewer.camera;
  camera.position = new Cesium.Cartesian3(0.25, 0.0, 0.0);
  camera.direction = new Cesium.Cartesian3(1.0, 0.0, 0.0);
  camera.up = new Cesium.Cartesian3(0.0, 0.0, 1.0);
  camera.right = new Cesium.Cartesian3(0.0, -1.0, 0.0);

  viewer.scene.postUpdate.addEventListener(function (scene, time) {
    if (!Cesium.defined(entity)) return;
    const position = entity.position?.getValue(time);
    if (!Cesium.defined(position)) {
      return;
    }

    let transform;
    if (!Cesium.defined(entity.orientation)) {
      transform = Cesium.Transforms.eastNorthUpToFixedFrame(position);
    } else {
      const orientation = entity.orientation.getValue(time);
      if (!Cesium.defined(orientation)) {
        return;
      }

      transform = Cesium.Matrix4.fromRotationTranslation(
        Cesium.Matrix3.fromQuaternion(orientation),
        position
      );
    }

    // Save camera state
    const offset = Cesium.Cartesian3.clone(camera.position);
    const direction = Cesium.Cartesian3.clone(camera.direction);
    const up = Cesium.Cartesian3.clone(camera.up);

    // Set camera to be in model's reference frame.
    camera.lookAtTransform(transform);

    // Reset the camera state to the saved state so it appears fixed in the model's frame.
    Cesium.Cartesian3.clone(offset, camera.position);
    Cesium.Cartesian3.clone(direction, camera.direction);
    Cesium.Cartesian3.clone(up, camera.up);
    Cesium.Cartesian3.cross(direction, up, camera.right);
  });

  // Add a few more balloons flying with the one the viewer is in.
  const numBalloons = 12;
  for (let i = 0; i < numBalloons; ++i) {
    const balloonRadius = (Cesium.Math.nextRandomNumber() * 2.0 - 1.0) * 0.01 + radius;
    const balloon = viewer.entities.add({
      availability: new Cesium.TimeIntervalCollection([
        new Cesium.TimeInterval({
          start,
          stop,
        }),
      ]),
      position: computeCirclularFlight(longitude, latitude, balloonRadius),
      model: {
        uri: modelURI,
        minimumPixelSize: 64,
      },
    });
    const position = balloon.position as Cesium.SampledPositionProperty;
    position.setInterpolationOptions({
      interpolationDegree: 2,
      interpolationAlgorithm: Cesium.HermitePolynomialApproximation,
    });
  }
};

function loadModel(viewer: Cesium.Viewer) {
  entity = viewer.entities.add({
    availability: new Cesium.TimeIntervalCollection([
      new Cesium.TimeInterval({
        start,
        stop,
      }),
    ]),
    position: computeCirclularFlight(longitude, latitude, radius),
    model: {
      uri: modelURI,
      minimumPixelSize: 64,
    },
  });
  const position = entity.position as Cesium.SampledPositionProperty;
  position.setInterpolationOptions({
    interpolationDegree: 2,
    interpolationAlgorithm: Cesium.HermitePolynomialApproximation,
  });
}
</script>

<template>
  <div class="wh-full overflow-hidden relative">
    <CesiumViewer :config="viewerConfig" @map-loaded="handleMapLoaded" />
  </div>
</template>

<style scoped lang="scss"></style>
