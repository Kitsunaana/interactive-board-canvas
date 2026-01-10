import { defaultTo, first } from "lodash";
import type { LimitPoints, Point, Rect } from "../type/shared";
import { screenToCanvas, type Camera } from "./point";

export const unscaleRect = (rect: Rect, unscale: number): Rect => ({
  height: rect.height / unscale,
  width: rect.width / unscale,
  y: rect.y / unscale,
  x: rect.x / unscale,
})

export const scaleRect = (rect: Rect, scale: number): Rect => ({
  height: rect.height * scale,
  width: rect.width * scale,
  y: rect.y * scale,
  x: rect.x * scale,
})

export const inferRect = <T extends Rect>(value: T): Rect => ({
  height: value.height,
  width: value.width,
  x: value.x,
  y: value.y,
})

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

export const isRectIntersectionV2 = ({ rect, point }: {
  point: Point
  rect: Rect
}) => {
  return (
    point.x >= rect.x && point.x <= rect.x + rect.width &&
    point.y >= rect.y && point.y <= rect.y + rect.height
  )
}

export const centerPointFromRect = (rect: Rect): Point => ({
  y: rect.y + rect.height / 2,
  x: rect.x + rect.width / 2,
})

export const calculateLimitPoints = ({ rects }: { rects: Rect[] }) => {
  const { height, width, x, y } = defaultTo(first(rects), {
    height: 0,
    width: 0,
    x: 0,
    y: 0,
  } satisfies Rect)

  return rects.reduce(
    (foundPoints, node) => {
      foundPoints.min.x = Math.min(foundPoints.min.x, node.x)
      foundPoints.min.y = Math.min(foundPoints.min.y, node.y)
      foundPoints.max.x = Math.max(foundPoints.max.x, node.x + node.width)
      foundPoints.max.y = Math.max(foundPoints.max.y, node.y + node.height)

      return foundPoints
    },
    {
      max: { x: x + width, y: y + height },
      min: { x, y },
    } satisfies LimitPoints
  )
}