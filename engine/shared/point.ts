import * as _ from "lodash"
import { Point, Rectangle, type PointData } from "../maths"

export const distance = (a: PointData, b: PointData) => Math.hypot(b.x - a.x, b.y - a.y)

export const angleBetweenPoints = (center: PointData, cursor: PointData) => {
  return Math.atan2(cursor.y - center.y, cursor.x - center.x)
}

export const pointFromEvent = (event: PointerEvent | MouseEvent): Point => new Point(event.clientX, event.clientY)

export const getPointFromEvent = (event: PointerEvent | MouseEvent): PointData => ({
  x: event.clientX,
  y: event.clientY,
})

export const getNormalizedPosition = (point: PointData, relative: Rectangle): Point => {
  const sizes = Point.fromSize(relative)

  return Point.fromData(point)
    .sub(relative)
    .div(sizes)
}

export const getAbsolutePosition = (point: Point, relative: Rectangle): Point => {
  const sizes = Point.fromSize(relative)

  return point
    .mul(sizes)
    .add(relative)
}