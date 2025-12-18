import { defaultTo } from "lodash"
import type { Point, Rect } from "./type"

type Camera = {
  scale?: number
  x: number
  y: number
}

export const screenToCanvas = ({ point, camera }: {
  camera: Camera
  point: Point,
}) => {
  return {
    x: (point.x - camera.x) / defaultTo(camera.scale, 1),
    y: (point.y - camera.y) / defaultTo(camera.scale, 1),
  }
}

export const isRectIntersection = ({ camera, rect, point }: {
  camera: Camera
  point: Point
  rect: Rect
}) => {
  const worldPosition = screenToCanvas({ point, camera })

  return (
    worldPosition.x >= rect.x && worldPosition.x <= rect.x + rect.width &&
    worldPosition.y >= rect.y && worldPosition.y <= rect.y + rect.height
  )
}

export const subtractPoint = (point1: Point, point2: Point): Point => ({
  x: point2.x - point1.x,
  y: point2.y - point1.y,
})

export const centerPointFromRect = (rect: Rect): Point => ({
  y: rect.y + rect.height / 2,
  x: rect.x + rect.width / 2,
})
