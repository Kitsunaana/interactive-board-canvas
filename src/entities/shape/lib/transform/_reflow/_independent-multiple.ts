import type { GroupResizeState } from "@/features/board/model/resize/_get-group-resize-state"
import { isNotUndefined } from "@/shared/lib/utils"
import type { Point, Rect, RectWithId, RotatableRect } from "@/shared/type/shared"
import { SELECTION_BOUNDS_PADDING } from "../_const"

export type CalcSelectionResizeOffsetsParams = {
  selectionArea: Rect
  shapes: RectWithId[]
  cursor: Point
}

export type CalcSelectionResizeOffsets = (params: CalcSelectionResizeOffsetsParams) => Record<string, Partial<RotatableRect<true> & {
  points: Point[]
}>>

export const calcGroupRightBoundReflowPatch = (state: GroupResizeState, cursor: Point) => {
  const { shapes, pivotX, initialWidth } = state

  const correctedCursorX = cursor.x - SELECTION_BOUNDS_PADDING
  const delta = correctedCursorX - (pivotX + initialWidth)

  const padding2 = SELECTION_BOUNDS_PADDING * 2

  if (delta <= padding2 && delta >= -padding2) return {}

  return shapes.reduce((acc, shape) => {
    const shapeLeft = shape.centerX - shape.width / 2
    const t = (shapeLeft - pivotX) / initialWidth
    const easedT = Math.max(0, Math.min(1, t))

    const offsetX = delta < 0 ? easedT * (delta + padding2) : easedT * delta

    if (isNotUndefined(shape.points)) {
      const cos = Math.cos(shape.rotate)
      const sin = Math.sin(shape.rotate)

      const movedPoints = shape.points.map((point) => ({
        x: point.x + offsetX * cos,
        y: point.y + offsetX * sin,
      }))

      acc[shape.id] = { points: movedPoints }
      return acc
    }

    const nextCenterX = shape.centerX + offsetX
    const nextX = nextCenterX - shape.width / 2

    acc[shape.id] = { x: nextX }
    return acc
  }, {} as Record<string, Partial<RotatableRect<true> & { points: Point[] }>>)
}

export const calcGroupLeftBoundReflowPatch = (state: GroupResizeState, cursor: Point) => {
  const { shapes, pivotX, initialWidth } = state

  const correctedCursorX = cursor.x + SELECTION_BOUNDS_PADDING
  const delta = correctedCursorX - pivotX

  const padding2 = SELECTION_BOUNDS_PADDING * 2

  if (delta <= padding2 && delta >= -padding2) return {}

  const pivotRight = pivotX + initialWidth

  return shapes.reduce((acc, shape) => {
    const shapeRight = shape.centerX + shape.width / 2

    const t = (pivotRight - shapeRight) / initialWidth
    const easedT = Math.max(0, Math.min(1, t))

    const offsetX = delta > 0 ? easedT * (delta - padding2) : easedT * delta

    if (isNotUndefined(shape.points)) {
      const cos = Math.cos(shape.rotate)
      const sin = Math.sin(shape.rotate)

      const movedPoints = shape.points.map((point) => ({
        x: point.x + offsetX * cos,
        y: point.y + offsetX * sin,
      }))

      acc[shape.id] = { points: movedPoints }
      return acc
    }

    const nextCenterX = shape.centerX + offsetX
    const nextX = nextCenterX - shape.width / 2

    acc[shape.id] = { x: nextX }
    return acc
  }, {} as Record<string, Partial<RotatableRect<true> & { points: Point[] }>>)
}

export const calcGroupTopBoundReflowPatch = (state: GroupResizeState, cursor: Point) => {
  const { shapes, pivotY, initialHeight } = state

  const correctedCursorY = cursor.y - SELECTION_BOUNDS_PADDING
  const delta = correctedCursorY - pivotY

  const padding2 = SELECTION_BOUNDS_PADDING * 2

  if (delta <= padding2 && delta >= -padding2) return {}

  const pivotBottom = pivotY + initialHeight

  return shapes.reduce((acc, shape) => {
    const shapeBottom = shape.centerY + shape.height / 2

    const t = (pivotBottom - shapeBottom) / initialHeight
    const easedT = Math.max(0, Math.min(1, t))

    const offsetY = delta > 0 ? easedT * (delta - padding2) : easedT * delta

    if (isNotUndefined(shape.points)) {
      const cos = Math.cos(shape.rotate)
      const sin = Math.sin(shape.rotate)

      const movedPoints = shape.points.map((point) => ({
        x: point.x - offsetY * sin,
        y: point.y + offsetY * cos,
      }))

      acc[shape.id] = { points: movedPoints }
      return acc
    }

    const nextCenterY = shape.centerY + offsetY
    const nextY = nextCenterY - shape.height / 2

    acc[shape.id] = { y: nextY }
    return acc
  }, {} as Record<string, Partial<RotatableRect<true> & { points: Point[] }>>)
}

export const calcGroupBottomBoundReflowPatch = (
  state: GroupResizeState,
  cursor: Point
) => {
  const { shapes, pivotY, initialHeight } = state

  const correctedCursorY = cursor.y - SELECTION_BOUNDS_PADDING
  const delta = correctedCursorY - (pivotY + initialHeight)

  const padding2 = SELECTION_BOUNDS_PADDING * 2

  if (delta <= padding2 && delta >= -padding2) return {}

  return shapes.reduce((acc, shape) => {
    const shapeTop = shape.centerY - shape.height / 2

    const t = (shapeTop - pivotY) / initialHeight
    const easedT = Math.max(0, Math.min(1, t))

    const offsetY =
      delta < 0
        ? easedT * (delta + padding2)
        : easedT * delta

    if (isNotUndefined(shape.points)) {
      const cos = Math.cos(shape.rotate)
      const sin = Math.sin(shape.rotate)

      const movedPoints = shape.points.map((point) => ({
        x: point.x - offsetY * sin,
        y: point.y + offsetY * cos,
      }))

      acc[shape.id] = { points: movedPoints }
      return acc
    }

    const nextCenterY = shape.centerY + offsetY
    const nextY = nextCenterY - shape.height / 2

    acc[shape.id] = { y: nextY }
    return acc
  }, {} as Record<string, Partial<RotatableRect<true> & { points: Point[] }>>)
}


export const independentGroupReflowFromBound = {
  bottom: calcGroupBottomBoundReflowPatch,
  right: calcGroupRightBoundReflowPatch,
  left: calcGroupLeftBoundReflowPatch,
  top: calcGroupTopBoundReflowPatch,
}