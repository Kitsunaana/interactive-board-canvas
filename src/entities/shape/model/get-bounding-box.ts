import { getAABBSize, rectGeomteryFromTopLeftToCenter, type AABB } from "@/shared/lib/rect"
import type { Point, Rect } from "@/shared/type/shared"
import type { EllipseGeometry, RectangleGeometry, ShapeGeometry } from "./types"

export const getRotatedPolygoneAABB = (points: Point[], rotate: number): AABB => {
  const xPos = points.map((point) => point.x)
  const yPos = points.map((point) => point.y)

  const minX = Math.min(...xPos)
  const minY = Math.min(...yPos)
  const maxX = Math.max(...xPos)
  const maxY = Math.max(...yPos)

  const pivot: Point = {
    x: maxX - ((maxX - minX) / 2),
    y: maxY - ((maxY - minY) / 2),
  }

  const degrees = rotate * 58
  const radians = degrees * (Math.PI / 180)
  const cos = Math.cos(radians)
  const sin = Math.sin(radians)

  function rotatePoint(pivot: Point, point: Point, cos: number, sin: number) {
    return {
      x: (cos * (point.x - pivot.x)) - (sin * (point.y - pivot.y)) + pivot.x,
      y: (sin * (point.x - pivot.x)) + (cos * (point.y - pivot.y)) + pivot.y,
    }
  }

  const boundingBox = {
    x1: Number.POSITIVE_INFINITY,
    y1: Number.POSITIVE_INFINITY,
    x2: Number.NEGATIVE_INFINITY,
    y2: Number.NEGATIVE_INFINITY,
  }

  points.forEach((point) => {
    let rotatedPoint = rotatePoint(pivot, point, cos, sin)

    boundingBox.x1 = Math.min(boundingBox.x1, rotatedPoint.x)
    boundingBox.y1 = Math.min(boundingBox.y1, rotatedPoint.y)
    boundingBox.x2 = Math.max(boundingBox.x2, rotatedPoint.x)
    boundingBox.y2 = Math.max(boundingBox.y2, rotatedPoint.y)
  })

  return {
    minX: boundingBox.x1,
    minY: boundingBox.y1,
    maxX: boundingBox.x2,
    maxY: boundingBox.y2,
  }
}

export const getRotatedRectangleAABB = (rect: Rect, rotate: number): AABB => {
  const hw = rect.width / 2
  const hh = rect.height / 2

  const cos = Math.cos(rotate)
  const sin = Math.sin(rotate)

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

export const getRotatedEllipseAABB = (geometry: EllipseGeometry, rotate: number): AABB => {
  const centerX = geometry.cx
  const centerY = geometry.cy
  const radiusX = geometry.rx
  const radiusY = geometry.ry

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
    minX: x,
    minY: y,
    maxX: x + width,
    maxY: y + height,
  }
}



export const getBoundingBox = (geometry: ShapeGeometry, rotate: number) => {
  switch (geometry.kind) {
    case "rectangle-geometry": {
      return getAABBSize(getRotatedRectangleAABB(rectGeomteryFromTopLeftToCenter(geometry), rotate))
    }
    case "ellipse-geometry": {
      return getAABBSize(getRotatedEllipseAABB(geometry, rotate))
    }
    case "diamond-geometry": {
      const diamonToRectangle: RectangleGeometry = {
        kind: "rectangle-geometry",
        height: geometry.height,
        width: geometry.width,
        x: geometry.cx,
        y: geometry.cy,
      }

      return getAABBSize(getRotatedRectangleAABB(diamonToRectangle, rotate))
    }
    case "path-geometry": {
      return getAABBSize(getRotatedPolygoneAABB(geometry.points, rotate))
    }
    default: {
      throw new Error(`unknown geometry kind is not supported`)
    }
  }
}