import { defaultTo } from "lodash"
import type { Point, Sizes } from "../type/shared"

export type Camera = {
  scale?: number
  x: number
  y: number
}

export const screenToCanvas = ({ point, camera }: { camera: Camera, point: Point }) => ({
  x: (point.x - camera.x) / defaultTo(camera.scale, 1),
  y: (point.y - camera.y) / defaultTo(camera.scale, 1),
})

export const sizesToPoint = (sizes: Sizes): Point => ({
  y: sizes.height,
  x: sizes.width,
})

export const addPoint = (point1: Point, point2: Point): Point => ({
  x: point2.x + point1.x,
  y: point2.y + point1.y,
})

export const subtractPoint = (point1: Point, point2: Point): Point => ({
  x: point2.x - point1.x,
  y: point2.y - point1.y,
})

export const getPointFromEvent = (event: PointerEvent): Point => ({
  x: event.clientX,
  y: event.clientY,
})

