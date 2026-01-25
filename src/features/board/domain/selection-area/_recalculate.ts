import { SELECTION_BOUNDS_PADDING } from "@/entities/shape"
import type { Point, Rect } from "@/shared/type/shared"
import type { SelectionBounds } from "./_types"

export type RecalculateFromBoundParams = {
  initial: SelectionBounds
  cursor: Point
}

const recalculateFromTopBound = ({ initial, cursor }: RecalculateFromBoundParams) => {
  const areaTop = initial.area.y
  const cursorPositionY = cursor.y + SELECTION_BOUNDS_PADDING
  const delta = areaTop - cursorPositionY

  return {
    y: initial.area.y - delta,
    height: initial.area.height + delta
  }
}

const recalculateFromLeftBound = ({ initial, cursor }: RecalculateFromBoundParams) => {
  const areaLeft = initial.area.x
  const cursorPositionX = cursor.x + SELECTION_BOUNDS_PADDING
  const delta = areaLeft - cursorPositionX

  return {
    x: initial.area.x - delta,
    width: initial.area.width + delta
  }
}

const recalculateFromRightBound = ({ initial, cursor }: RecalculateFromBoundParams) => {
  const areaRight = initial.area.x + initial.area.width
  const cursorPositionX = cursor.x - SELECTION_BOUNDS_PADDING
  const delta = cursorPositionX - areaRight

  return {
    x: initial.area.x,
    width: initial.area.width + delta
  }
}

const recalculateFromBottomBound = ({ initial, cursor }: RecalculateFromBoundParams) => {
  const areaBottom = initial.area.y + initial.area.height
  const cursorPositionY = cursor.y - SELECTION_BOUNDS_PADDING
  const delta = cursorPositionY - areaBottom

  return {
    y: initial.area.y,
    height: initial.area.height + delta
  }
}

const recalculateFromBottomRightCorner = (params: RecalculateFromBoundParams) => ({
  ...recalculateFromRightBound(params),
  ...recalculateFromBottomBound(params),
})

const recalculateFromBottomLeftCorner = (params: RecalculateFromBoundParams) => ({
  ...recalculateFromLeftBound(params),
  ...recalculateFromBottomBound(params),
})

const recalculateFromTopRightCorner = (params: RecalculateFromBoundParams) => ({
  ...recalculateFromRightBound(params),
  ...recalculateFromTopBound(params),
})

const recalculateFromTopLeftCorner = (params: RecalculateFromBoundParams) => ({
  ...recalculateFromLeftBound(params),
  ...recalculateFromTopBound(params),
})

export const calcSelectionAreaFromBound: Record<string, (params: RecalculateFromBoundParams) => Partial<Rect>> = {
  bottom: recalculateFromBottomBound,
  right: recalculateFromRightBound,
  left: recalculateFromLeftBound,
  top: recalculateFromTopBound,
}

export const calcSelectionAreaFromCorner: Record<string, (params: RecalculateFromBoundParams) => Partial<Rect>> = {
  bottomRight: recalculateFromBottomRightCorner,
  bottomLeft: recalculateFromBottomLeftCorner,
  topRight: recalculateFromTopRightCorner,
  topLeft: recalculateFromTopLeftCorner,
}