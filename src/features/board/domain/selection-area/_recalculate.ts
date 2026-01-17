import type { Point } from "@/shared/type/shared"
import type { SelectionArea } from "./_type"

export const SELECTION_BOUNDS_PADDING = 7

type RecalculateFromEdgeParams = {
  current: SelectionArea
  initial: SelectionArea
  cursor: Point
}

const recalculateFromTopEdge = ({ current, initial, cursor }: RecalculateFromEdgeParams) => {
  const areaTop = initial.area.y
  const cursorPositionY = cursor.y + SELECTION_BOUNDS_PADDING
  const delta = areaTop - cursorPositionY

  return {
    ...current,
    area: {
      ...current.area,
      y: initial.area.y - delta,
      height: initial.area.height + delta
    }
  }
}

const recalculateFromBottomEdge = ({ current, initial, cursor }: RecalculateFromEdgeParams) => {
  const areaBottom = initial.area.y + initial.area.height
  const cursorPositionY = cursor.y - SELECTION_BOUNDS_PADDING
  const delta = cursorPositionY - areaBottom

  return {
    ...current,
    area: {
      ...current.area,
      y: initial.area.y,
      height: initial.area.height + delta
    }
  }
}

const recalculateFromLeftEdge = ({ current, initial, cursor }: RecalculateFromEdgeParams) => {
  const areaLeft = initial.area.x
  const cursorPositionX = cursor.x + SELECTION_BOUNDS_PADDING
  const delta = areaLeft - cursorPositionX

  return {
    ...current,
    area: {
      ...current.area,
      x: initial.area.x - delta,
      width: initial.area.width + delta
    }
  }
}

const recalculateFromRightEdge = ({ current, initial, cursor }: RecalculateFromEdgeParams) => {
  const areaRight = initial.area.x + initial.area.width
  const cursorPositionX = cursor.x - SELECTION_BOUNDS_PADDING
  const delta = cursorPositionX - areaRight

  return {
    ...current,
    area: {
      ...current.area,
      x: initial.area.x,
      width: initial.area.width + delta
    }
  }
}

export const recalculateSelectionAreaFromEdge = {
  bottom: recalculateFromBottomEdge,
  right: recalculateFromRightEdge,
  left: recalculateFromLeftEdge,
  top: recalculateFromTopEdge,
}