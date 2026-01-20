import type { Point } from "@/shared/type/shared"
import type { SelectionArea } from "./_type"

export const SELECTION_BOUNDS_PADDING = 7

export type RecalculateFromBoundParams = {
  initial: SelectionArea
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

const recalculateFromBottomRightCorner = ({ initial, cursor }: RecalculateFromBoundParams) => ({
  ...recalculateFromRightBound({ initial, cursor }),
  ...recalculateFromBottomBound({ initial, cursor }),
})

const recalculateFromBottomLeftCorner = ({ initial, cursor }: RecalculateFromBoundParams) => ({
  ...recalculateFromLeftBound({ initial, cursor }),
  ...recalculateFromBottomBound({ initial, cursor }),
})

const recalculateFromTopRightCorner = ({ initial, cursor }: RecalculateFromBoundParams) => ({
  ...recalculateFromRightBound({ initial, cursor }),
  ...recalculateFromTopBound({ initial, cursor }),
})

const recalculateFromTopLeftCorner = ({ initial, cursor }: RecalculateFromBoundParams) => ({
  ...recalculateFromLeftBound({ initial, cursor }),
  ...recalculateFromTopBound({ initial, cursor }),
})

export const calcSelectionAreaFromBound = {
  bottom: recalculateFromBottomBound,
  right: recalculateFromRightBound,
  left: recalculateFromLeftBound,
  top: recalculateFromTopBound,
}

export const calcSelectionAreaFromCorner = {
  bottomRight: recalculateFromBottomRightCorner,
  bottomLeft: recalculateFromBottomLeftCorner,
  topRight: recalculateFromTopRightCorner,
  topLeft: recalculateFromTopLeftCorner,
}