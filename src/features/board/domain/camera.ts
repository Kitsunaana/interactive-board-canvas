import type {Point, Sizes} from "../../../shared/type/shared.ts";
import {screenToCanvas, sizesToPoint} from "../../../shared/lib/point.ts";
import {START_POINT} from "../const/camera.ts";

export type Camera = {
  scale: number
  x: number
  y: number
}

export type CameraState = {
  lastPosition: Point
  panOffset: Point
  velocity: Point
  camera: Camera
}

export type ZoomEvent = {
  __event: "zoomIn" | "zoomOut"
}

export const getWorldPoints = ({ sizes, camera }: {
  camera: Camera
  sizes: Sizes
}) => ({
  sizes,
  startWorld: screenToCanvas({
    point: START_POINT,
    camera,
  }),
  endWorld: screenToCanvas({
    point: sizesToPoint(sizes),
    camera,
  }),
})