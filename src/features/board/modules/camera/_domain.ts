import { screenToCanvasV2, sizesToPoint } from "@/shared/lib/point"
import type { Sizes } from "@/shared/type/shared"

export type Camera = {
  scale: number
  x: number
  y: number
}

export type ZoomAction = "zoomIn" | "zoomOut"

export const getWorldPoints = (camera: Camera, sizes: Sizes) => ({
  startWorld: screenToCanvasV2({ x: 0, y: 0 }, camera),
  endWorld: screenToCanvasV2(sizesToPoint(sizes), camera),
})