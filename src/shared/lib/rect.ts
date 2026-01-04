import type { Point, Rect } from "../type/shared";
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

export const centerPointFromRect = (rect: Rect): Point => ({
  y: rect.y + rect.height / 2,
  x: rect.x + rect.width / 2,
})