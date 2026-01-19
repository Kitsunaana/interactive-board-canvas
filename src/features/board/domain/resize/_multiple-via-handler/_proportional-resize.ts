import { ProportionalResize } from "../_multiple-via-bound"
import type { ResizeMultipleFromBoundParams } from "../_shared"

export const resizeFromTopLeftCorner = ProportionalResize.resizeFromTopBound

export const resizeFromBottomLeftCorner = ProportionalResize.resizeFromLeftBound

export const resizeFromBottomRightCorner = ProportionalResize.resizeFromRightBound

export const resizeFromTopRightCorner = ({ cursor, shapes, selectionArea }: ResizeMultipleFromBoundParams) => {
  return ProportionalResize.resizeFromRightBound({
    selectionArea,
    cursor,
    shapes,

    frizen: (_, __, area) => ({ y: area.bottom }),
    flip: (scale, shape, area) => ({ y: area.bottom + (shape.y - area.top) * scale }),
    default: (scale, shape, area) => ({ y: area.bottom + (shape.y - area.bottom) * scale }),
  })
}