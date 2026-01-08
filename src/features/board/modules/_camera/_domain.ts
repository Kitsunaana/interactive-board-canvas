import { screenToCanvas, sizesToPoint } from "@/shared/lib/point"
import type { Point, Sizes } from "@/shared/type/shared"
import { START_POINT } from "./_const"

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

export type ZoomAction = {
  action: "zoomIn" | "zoomOut"
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