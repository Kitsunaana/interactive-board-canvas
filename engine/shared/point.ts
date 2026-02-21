import * as _ from "lodash"
import type { PointData } from "../maths"

export function addPoint(a: PointData, b: number): PointData
export function addPoint(a: PointData, b: PointData): PointData
export function addPoint(a: PointData, b: PointData | number): PointData {
  if (_.isNumber(b)) {
    return {
      x: a.x + b,
      y: a.y + b,
    }
  }

  return {
    x: a.x + b.x,
    y: a.y + b.y,
  }
}

export function multiplePoint(a: PointData, b: number): PointData
export function multiplePoint(a: PointData, b: PointData): PointData
export function multiplePoint(a: PointData, b: PointData | number): PointData {
  if (_.isNumber(b)) {
    return {
      x: a.x * b,
      y: a.y * b,
    }
  }

  return {
    x: a.x * b.x,
    y: a.y * b.y,
  }
}

export const subtractPoint = (a: PointData, b: PointData): PointData => ({
  x: b.x - a.x,
  y: b.y - a.y,
})

export const distance = (a: PointData, b: PointData) => Math.hypot(b.x - a.x, b.y - a.y)

export const angleBetweenPoints = (center: PointData, cursor: PointData) => {
  return Math.atan2(cursor.y - center.y, cursor.x - center.x)
}

export const getPointFromEvent = (event: PointerEvent | MouseEvent): PointData => ({
  x: event.clientX,
  y: event.clientY,
})