import type { Point, Rect } from "@/shared/type/shared"
import * as AbsShapeDomain from "./abstract-shape.types"
import * as ShapeDomain from "./shapes.types"

export const foo = () => { }

const getLimintPoints = (points: Point[]) => {
  let minX = points[0].x
  let minY = points[0].y
  let maxX = points[0].x
  let maxY = points[0].y

  points.forEach((point) => {
    if (point.x < minX) minX = point.x
    else if (point.x > maxX) maxX = point.x

    if (point.y < minY) minY = point.y
    else if (point.y > maxY) maxY = point.y
  })

  return {
    min: {
      x: minX,
      y: minY,
    },
    max: {
      x: maxX,
      y: maxY,
    }
  }
}

type AABB = {
  minX: number
  minY: number
  maxX: number
  maxY: number
}

export const getRotatedRectAABB = (rect: Rect, angle: number): AABB => {
  const hw = rect.width / 2
  const hh = rect.height / 2

  const cos = Math.cos(angle)
  const sin = Math.sin(angle)

  const corners = [
    { x: -hw, y: -hh },
    { x: hw, y: -hh },
    { x: hw, y: hh },
    { x: -hw, y: hh },
  ]

  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity

  for (const p of corners) {
    const x = p.x * cos - p.y * sin + rect.x
    const y = p.x * sin + p.y * cos + rect.y

    minX = Math.min(minX, x)
    minY = Math.min(minY, y)
    maxX = Math.max(maxX, x)
    maxY = Math.max(maxY, y)
  }

  return {
    minX,
    minY,
    maxX,
    maxY,
  }
}

export const getAABBSize = (aabb: AABB) => {
  return {
    x: aabb.minX,
    y: aabb.minY,
    width: aabb.maxX - aabb.minX,
    height: aabb.maxY - aabb.minY,
  }
}

export const getRotatedEllipseAABB = (geometry: AbsShapeDomain.RectGeometry, rotate: number) => {
  const centerX = geometry.x + geometry.width / 2
  const centerY = geometry.y + geometry.height / 2
  const radiusX = geometry.width / 2
  const radiusY = geometry.height / 2

  const degrees = rotate * 58

  const radians = degrees * (Math.PI / 180)
  const radians90 = radians + Math.PI / 2

  const ux = radiusX * Math.cos(radians)
  const uy = radiusX * Math.sin(radians)
  const vx = radiusY * Math.cos(radians90)
  const vy = radiusY * Math.sin(radians90)

  const width = Math.sqrt(ux * ux + vx * vx) * 2
  const height = Math.sqrt(uy * uy + vy * vy) * 2
  const x = centerX - (width / 2)
  const y = centerY - (height / 2)

  return {
    x,
    y,
    width,
    height,
  }
}

export const getBoundingBox = (shape: ShapeDomain.CanvasShape) => {
  if (shape.kind === "arrow") {
    if (shape.geometry.type === "path") {
      const { min, max } = getLimintPoints(shape.geometry.points)

      return {
        x: min.x,
        y: min.y,
        width: max.x - min.x,
        height: max.y - min.y,
      } satisfies Rect
    }

    if (shape.geometry.type === "rect") {
      throw new Error("Arrow is not supported rect geometry")
    }
  }

  if (shape.kind === "shape") {
    if (shape.geometry.type === "rect") {
      if (shape.transform.rotate === 0) return shape.geometry

      const translatedRect: Rect = {
        x: shape.geometry.x + shape.geometry.width / 2,
        y: shape.geometry.y + shape.geometry.height / 2,
        width: shape.geometry.width,
        height: shape.geometry.height,
      }

      return getAABBSize(getRotatedRectAABB(translatedRect, shape.transform.rotate))
    }

    if (shape.geometry.type === "path") {
      throw new Error("Shape is not supported path geometry")
    }
  }

  return {} as Rect
}