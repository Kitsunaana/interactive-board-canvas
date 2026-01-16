import type { Point } from "@/shared/type/shared"
import type { SelectionBounds } from "../../modules/_pick-node/_core"
import { PADDING } from "../../view-model/sticker"
import type { BoundVariant } from "../_selection/_selection.type"

export type RecalculateFromEdgeParams = {
  current: SelectionBounds
  first: SelectionBounds

  cursor: Point
}

const recalculateFromTopEdge = ({ current, first, cursor }: RecalculateFromEdgeParams) => {
  const areaTop = first.area.y
  const cursorPositionY = cursor.y + PADDING
  const delta = areaTop - cursorPositionY

  return {
    ...current,
    area: {
      ...current.area,
      y: first.area.y - delta,
      height: first.area.height + delta
    }
  }
}

const recalculateFromBottomEdge = ({ current, first, cursor }: RecalculateFromEdgeParams) => {
  const areaBottom = first.area.y + first.area.height
  const cursorPositionY = cursor.y - PADDING
  const delta = cursorPositionY - areaBottom

  return {
    ...current,
    area: {
      ...current.area,
      y: first.area.y,
      height: first.area.height + delta
    }
  }
}

const recalculateFromLeftEdge = ({ current, first, cursor }: RecalculateFromEdgeParams) => {
  const areaLeft = first.area.x
  const cursorPositionX = cursor.x + PADDING
  const delta = areaLeft - cursorPositionX
  
  return {
    ...current,
    area: {
      ...current.area,
      x: first.area.x - delta,
      width: first.area.width + delta
    }
  }
}

const recalculateFromRightEdge = ({ current, first, cursor }: RecalculateFromEdgeParams) => {
  const areaRight = first.area.x + first.area.width
  const cursorPositionX = cursor.x - PADDING
  const delta = cursorPositionX - areaRight

  return {
    ...current,
    area: {
      ...current.area,
      x: first.area.x,
      width: first.area.width + delta
    }
  }
}

export const recalculateSelectionBoundsFromEdge: Record<
  BoundVariant,
  (params: RecalculateFromEdgeParams) => SelectionBounds
> = {
  bottom: recalculateFromBottomEdge,
  right: recalculateFromRightEdge,
  left: recalculateFromLeftEdge,
  top: recalculateFromTopEdge,
}