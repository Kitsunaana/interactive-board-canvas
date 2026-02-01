import * as _ from "lodash";
import type { AABB, LimitPoints, Point, Rect } from "../type/shared";
import { screenToCanvas, type Camera } from "./point";
import { isNegative } from "./utils";

export const divisionRect = (rect: Rect, value: number): Rect => ({
  height: rect.height / value,
  width: rect.width / value,
  y: rect.y / value,
  x: rect.x / value,
})

export const multipleRect = (rect: Rect, value: number): Rect => ({
  height: rect.height * value,
  width: rect.width * value,
  y: rect.y * value,
  x: rect.x * value,
})

export const inferRect = <T extends Rect>(rect: T): Rect => ({
  height: rect.height,
  width: rect.width,
  x: rect.x,
  y: rect.y,
})

export const centerPointFromRect = (rect: Rect): Point => ({
  y: rect.y + rect.height / 2,
  x: rect.x + rect.width / 2,
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

export const isRectIntersectionWithoutCamera = ({ rect, point }: {
  point: Point
  rect: Rect
}) => {
  return (
    point.x >= rect.x && point.x <= rect.x + rect.width &&
    point.y >= rect.y && point.y <= rect.y + rect.height
  )
}

export const isRectIntersectionWithRotate = ({
  rect,
  point,
}: {
  rect: Rect & { rotate: number }
  point: Point
}): boolean => {
  const cx = rect.x + rect.width / 2
  const cy = rect.y + rect.height / 2

  const dx = point.x - cx
  const dy = point.y - cy

  const cos = Math.cos(-rect.rotate)
  const sin = Math.sin(-rect.rotate)

  const localX = dx * cos - dy * sin
  const localY = dx * sin + dy * cos

  return (
    localX >= -rect.width / 2 &&
    localX <= rect.width / 2 &&
    localY >= -rect.height / 2 &&
    localY <= rect.height / 2
  )
}

export const calculateLimitPointsFromRects = ({ rects }: { rects: Rect[] }) => {
  const { height, width, x, y } = _.defaultTo(_.first(rects), {
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

export const calculateLimitPointsFromRectsV2 = (rects: Rect[]) => {
  const { height, width, x, y } = _.defaultTo(_.first(rects), {
    height: 0,
    width: 0,
    x: 0,
    y: 0,
  } satisfies Rect)

  return rects.reduce(
    (foundPoints, node) => {
      foundPoints.minX = Math.min(foundPoints.minX, node.x)
      foundPoints.minY = Math.min(foundPoints.minY, node.y)
      foundPoints.maxX = Math.max(foundPoints.maxX, node.x + node.width)
      foundPoints.maxY = Math.max(foundPoints.maxY, node.y + node.height)

      return foundPoints
    },
    {
      minX: x,
      minY: y,
      maxX: x + width,
      maxY: y + height,
    } satisfies AABB
  )
}

export const rectBorderPointsStep = (rect: Rect, step = 5) => {
  const { x, y, width, height } = rect
  const points = []

  for (let i = 0; i < width; i += step) {
    points.push({ x: x + i, y })
    points.push({ x: x + i, y: y + height - 1 })
  }

  for (let i = step; i < height - step; i += step) {
    points.push({ x, y: y + i })
    points.push({ x: x + width - 1, y: y + i })
  }

  return points
}

export const worldRectToScreenRect = (rect: Rect, camera: Camera & { scale: number }) => {
  const x = Math.round((rect.x * camera.scale) + camera.x)
  const y = Math.round((rect.y * camera.scale) + camera.y)
  const height = Math.round(rect.height * camera.scale)
  const width = Math.round(rect.width * camera.scale)

  return {
    x: isNegative(width) ? x - Math.abs(width) : x,
    y: isNegative(height) ? y - Math.abs(height) : y,
    width: Math.abs(width),
    height: Math.abs(height),
  }
}

export const normalizeRect = ({ height, width, x, y }: Rect) => {
  return {
    x: isNegative(width) ? x - Math.abs(width) : x,
    y: isNegative(height) ? y - Math.abs(height) : y,
    width: Math.abs(width),
    height: Math.abs(height),
  }
}



export const getAABBSize = (aabb: AABB, shift: number = 1) => {
  return {
    x: aabb.minX - shift,
    y: aabb.minY - shift,
    width: (aabb.maxX - aabb.minX) + shift * 2,
    height: (aabb.maxY - aabb.minY) + shift * 2,
  }
}

export const getRectWithOffset = (rect: Rect, offset: number) => {
  return {
    x: rect.x - offset,
    y: rect.y - offset,
    width: rect.width + offset * 2,
    height: rect.height + offset * 2,
  }
}

export const rectGeomteryFromTopLeftToCenter = (rect: Rect) => {
  return {
    y: rect.y + rect.height / 2,
    x: rect.x + rect.width / 2,
    height: rect.height,
    width: rect.width,
  }
}