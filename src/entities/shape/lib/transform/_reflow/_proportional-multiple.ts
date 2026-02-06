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

export const calcGroupRightBoundProportionalReflowPatch = (state: GroupResizeState, cursor: Point) => {
  const { initialWidth, shapes, pivotX, pivotY } = state

  const cursorX = cursor.x - SELECTION_BOUNDS_PADDING

  const anchorX = pivotX
  const anchorY = pivotY

  const rawWidth = cursorX - anchorX
  const flipped = rawWidth < 0

  const nextWidth = Math.abs(rawWidth)
  const scale = initialWidth === 0 ? 1 : nextWidth / initialWidth

  return shapes.reduce((acc, shape) => {
    const relCenterX = shape.centerX - anchorX
    const relCenterY = shape.centerY - anchorY

    const nextCenterX = flipped
      ? anchorX - relCenterX * scale
      : anchorX + relCenterX * scale

    const nextCenterY = anchorY + relCenterY * scale

    const dx = nextCenterX - shape.centerX
    const dy = nextCenterY - shape.centerY

    if (isNotUndefined(shape.points)) {
      acc[shape.id] = {
        points: shape.points.map(p => ({
          x: p.x + dx,
          y: p.y + dy,
        }))
      }
      return acc
    }

    acc[shape.id] = {
      x: shape.x + dx,
      y: shape.y + dy,
    }

    return acc
  }, {} as Record<string, Partial<RotatableRect<true> & { points?: Point[] }>>)
}

export const calcGroupLeftBoundProportionalReflowPatch = (state: GroupResizeState, cursor: Point) => {
  const { initialWidth, shapes, pivotX, pivotY } = state

  const cursorX = cursor.x + SELECTION_BOUNDS_PADDING

  const anchorX = pivotX
  const anchorY = pivotY

  const rawWidth = anchorX - cursorX
  const flipped = rawWidth < 0

  const nextWidth = Math.abs(rawWidth)
  const scale = initialWidth === 0 ? 1 : nextWidth / initialWidth

  return shapes.reduce((acc, shape) => {
    const relCenterX = shape.centerX - anchorX
    const relCenterY = shape.centerY - anchorY

    const nextCenterX = flipped
      ? anchorX - relCenterX * scale
      : anchorX + relCenterX * scale

    const nextCenterY = anchorY + relCenterY * scale

    const dx = nextCenterX - shape.centerX
    const dy = nextCenterY - shape.centerY

    if (isNotUndefined(shape.points)) {
      acc[shape.id] = {
        points: shape.points.map(p => ({
          x: p.x + dx,
          y: p.y + dy,
        }))
      }
      return acc
    }

    acc[shape.id] = {
      x: shape.x + dx,
      y: shape.y + dy,
    }

    return acc
  }, {} as Record<string, Partial<RotatableRect<true> & { points?: Point[] }>>)
}

export const calcGroupTopBoundProportionalReflowPatch = (state: GroupResizeState, cursor: Point) => {
  const { initialHeight, shapes, pivotX, pivotY } = state

  const cursorY = cursor.y + SELECTION_BOUNDS_PADDING

  const anchorX = pivotX
  const anchorY = pivotY

  const rawHeight = anchorY - cursorY
  const flipped = rawHeight < 0

  const nextHeight = Math.abs(rawHeight)
  const scale = initialHeight === 0 ? 1 : nextHeight / initialHeight

  return shapes.reduce((acc, shape) => {
    const relCenterX = shape.centerX - anchorX
    const relCenterY = shape.centerY - anchorY

    const nextCenterX = anchorX + relCenterX * scale
    const nextCenterY = flipped
      ? anchorY - relCenterY * scale
      : anchorY + relCenterY * scale

    const dx = nextCenterX - shape.centerX
    const dy = nextCenterY - shape.centerY

    if (isNotUndefined(shape.points)) {
      acc[shape.id] = {
        points: shape.points.map(p => ({
          x: p.x + dx,
          y: p.y + dy,
        }))
      }
      return acc
    }

    acc[shape.id] = {
      x: shape.x + dx,
      y: shape.y + dy,
    }

    return acc
  }, {} as Record<string, Partial<RotatableRect<true> & { points?: Point[] }>>)
}

export const calcGroupBottomBoundProportionalReflowPatch = (state: GroupResizeState, cursor: Point) => {
  const { initialHeight, shapes, pivotX, pivotY } = state

  const cursorY = cursor.y - SELECTION_BOUNDS_PADDING

  const anchorX = pivotX
  const anchorY = pivotY

  const rawHeight = cursorY - anchorY
  const flipped = rawHeight < 0

  const nextHeight = Math.abs(rawHeight)
  const scale = initialHeight === 0 ? 1 : nextHeight / initialHeight

  return shapes.reduce((acc, shape) => {
    const relCenterX = shape.centerX - anchorX
    const relCenterY = shape.centerY - anchorY

    const nextCenterX = anchorX + relCenterX * scale
    const nextCenterY = flipped
      ? anchorY - relCenterY * scale
      : anchorY + relCenterY * scale

    const dx = nextCenterX - shape.centerX
    const dy = nextCenterY - shape.centerY

    if (isNotUndefined(shape.points)) {
      acc[shape.id] = {
        points: shape.points.map(p => ({
          x: p.x + dx,
          y: p.y + dy,
        }))
      }
      return acc
    }

    acc[shape.id] = {
      x: shape.x + dx,
      y: shape.y + dy,
    }

    return acc
  }, {} as Record<string, Partial<RotatableRect<true> & { points?: Point[] }>>)
}


export const proportionalGroupReflowFromBound = {
  bottom: calcGroupBottomBoundProportionalReflowPatch,

  right: calcGroupRightBoundProportionalReflowPatch,
  left: calcGroupLeftBoundProportionalReflowPatch,
  top: calcGroupTopBoundProportionalReflowPatch,
}