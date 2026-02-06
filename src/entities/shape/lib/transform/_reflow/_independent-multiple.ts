import type { GroupResizeState } from "@/features/board/model/resize/_get-group-resize-state"
import { isNotUndefined } from "@/shared/lib/utils"
import type { Point, Rect, RectWithId, RotatableRect } from "@/shared/type/shared"
import { SELECTION_BOUNDS_PADDING } from "../_const"

export type CalcSelectionResizeOffsetsParams = {
  selectionArea: Rect
  shapes: RectWithId[]
  cursor: Point
}

export type CalcSelectionResizeOffsets = (params: CalcSelectionResizeOffsetsParams) => Record<string, Partial<Rect & {
  points: Point[]
}>>

export const calcGroupRightBoundReflowPatch = (state: GroupResizeState, cursor: Point) => {
  const { pivotX, initialWidth, shapes } = state

  const cursorX = cursor.x - SELECTION_BOUNDS_PADDING

  const left = pivotX - initialWidth / 2

  const rawWidth = cursorX - left
  const flipped = rawWidth < 0

  const nextWidth = Math.abs(rawWidth)

  return shapes.reduce((acc, shape) => {
    const tRaw = (shape.centerX - left) / initialWidth
    const easedT = Math.max(0, Math.min(1, tRaw))

    const nextCenterX = flipped
      ? left - easedT * nextWidth
      : left + easedT * nextWidth

    const dx = nextCenterX - shape.centerX
    const dy = 0

    const updatedX = shape.x + dx
    const updatedY = shape.y + dy

    if (isNotUndefined(shape.points)) {
      acc[shape.id] = {
        points: shape.points.map((point) => ({
          x: point.x + dx,
          y: point.y + dy,
        }))
      }

      return acc
    }

    acc[shape.id] = {
      x: updatedX,
      y: updatedY,
    }

    return acc
  }, {} as Record<string, Partial<RotatableRect<true> & { points?: Point[] }>>)
}

export const calcGroupLeftBoundReflowPatch = (state: GroupResizeState, cursor: Point) => {
  const { pivotX, initialWidth, shapes } = state

  const cursorX = cursor.x + SELECTION_BOUNDS_PADDING

  const right = pivotX + initialWidth / 2

  const rawWidth = right - cursorX
  const flipped = rawWidth < 0

  const nextWidth = Math.abs(rawWidth)

  return shapes.reduce((acc, shape) => {
    const tRaw = (right - shape.centerX) / initialWidth
    const easedT = Math.max(0, Math.min(1, tRaw))

    const nextCenterX = flipped
      ? right + easedT * nextWidth
      : right - easedT * nextWidth

    const dx = nextCenterX - shape.centerX
    const dy = 0

    const updatedX = shape.x + dx
    const updatedY = shape.y + dy

    if (isNotUndefined(shape.points)) {
      acc[shape.id] = {
        points: shape.points.map((point) => ({
          x: point.x + dx,
          y: point.y + dy,
        })),
      }

      return acc
    }

    acc[shape.id] = {
      x: updatedX,
      y: updatedY,
    }

    return acc
  }, {} as Record<string, Partial<RotatableRect<true> & { points?: Point[] }>>)
}

export const calcGroupTopBoundReflowPatch = (state: GroupResizeState, cursor: Point) => {
  const { pivotY, initialHeight, shapes } = state

  const cursorY = cursor.y + SELECTION_BOUNDS_PADDING

  const bottom = pivotY + initialHeight / 2

  const rawHeight = bottom - cursorY
  const flipped = rawHeight < 0

  const nextHeight = Math.abs(rawHeight)

  return shapes.reduce((acc, shape) => {
    const tRaw = (bottom - shape.centerY) / initialHeight
    const easedT = Math.max(0, Math.min(1, tRaw))

    const nextCenterY = flipped
      ? bottom + easedT * nextHeight
      : bottom - easedT * nextHeight

    const dy = nextCenterY - shape.centerY
    const dx = 0

    const updatedX = shape.x + dx
    const updatedY = shape.y + dy

    if (isNotUndefined(shape.points)) {
      acc[shape.id] = {
        points: shape.points.map((point) => ({
          x: point.x + dx,
          y: point.y + dy,
        })),
      }

      return acc
    }

    acc[shape.id] = {
      x: updatedX,
      y: updatedY,
    }

    return acc
  }, {} as Record<string, Partial<RotatableRect<true> & { points?: Point[] }>>)
}

export const calcGroupBottomBoundReflowPatch = (state: GroupResizeState, cursor: Point) => {
  const { pivotY, initialHeight, shapes } = state

  const cursorY = cursor.y - SELECTION_BOUNDS_PADDING

  const top = pivotY - initialHeight / 2

  const rawHeight = cursorY - top
  const flipped = rawHeight < 0

  const nextHeight = Math.abs(rawHeight)

  return shapes.reduce((acc, shape) => {
    const tRaw = (shape.centerY - top) / initialHeight
    const easedT = Math.max(0, Math.min(1, tRaw))

    const nextCenterY = flipped
      ? top - easedT * nextHeight
      : top + easedT * nextHeight

    const dy = nextCenterY - shape.centerY
    const dx = 0

    const updatedX = shape.x + dx
    const updatedY = shape.y + dy

    if (isNotUndefined(shape.points)) {
      acc[shape.id] = {
        points: shape.points.map((point) => ({
          x: point.x + dx,
          y: point.y + dy,
        })),
      }

      return acc
    }

    acc[shape.id] = {
      x: updatedX,
      y: updatedY,
    }

    return acc
  }, {} as Record<string, Partial<RotatableRect<true> & { points?: Point[] }>>)
}

export const independentGroupReflowFromBound = {
  bottom: calcGroupBottomBoundReflowPatch,
  right: calcGroupRightBoundReflowPatch,
  left: calcGroupLeftBoundReflowPatch,
  top: calcGroupTopBoundReflowPatch,
}