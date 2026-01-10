import * as _ from "lodash"
import type { Point, Sizes } from "../type/shared"

export type Camera = {
  scale?: number
  x: number
  y: number
}

export const screenToCanvas = ({ point, camera }: { camera: Camera, point: Point }) => ({
  x: (point.x - camera.x) / _.defaultTo(camera.scale, 1),
  y: (point.y - camera.y) / _.defaultTo(camera.scale, 1),
})

export const sizesToPoint = (sizes: Sizes): Point => ({
  y: sizes.height,
  x: sizes.width,
})

export const pointToSizes = (point: Point): Sizes => ({
  height: point.y,
  width: point.x,
})

export function addPoint(point1: Point, point2: number): Point
export function addPoint(point1: Point, point2: Point): Point
export function addPoint(point1: Point, point2: Point | number): Point {
  if (_.isNumber(point2)) {
    return {
      x: point1.x + point2,
      y: point1.y + point2,
    }
  }

  return {
    x: point1.x + point2.x,
    y: point1.y + point2.y,
  }
}

export function multiplePoint(point1: Point, point2: number): Point
export function multiplePoint(point1: Point, point2: Point): Point
export function multiplePoint(point1: Point, point2: Point | number): Point {
  if (_.isNumber(point2)) {
    return {
      x: point1.x * point2,
      y: point1.y * point2,
    }
  }

  return {
    x: point1.x * point2.x,
    y: point1.y * point2.y,
  }
}

export const subtractPoint = (point1: Point, point2: Point): Point => ({
  x: point2.x - point1.x,
  y: point2.y - point1.y,
})

export const getPointFromEvent = (event: PointerEvent): Point => ({
  x: event.clientX,
  y: event.clientY,
})

