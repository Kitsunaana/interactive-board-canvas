import { ProportionalResize } from "../_multiple-via-bound"
import type { ResizeMultipleFromEdgeParams } from "../_shared"

export const resizeFromTopLeftCorner = ProportionalResize.resizeFromTopEdge

export const resizeFromBottomLeftCorner = ProportionalResize.resizeFromLeftEdge

export const resizeFromBottomRightCorner = ProportionalResize.resizeFromRightEdge

export const resizeFromTopRightCorner = ({ cursor, shapes, selectionArea }: ResizeMultipleFromEdgeParams) => {
  return ProportionalResize.resizeFromRightEdge({
    selectionArea,
    cursor,
    shapes,

    frizen: (_, __, area) => ({ y: area.bottom }),
    flip: (scale, shape, area) => ({ y: area.bottom + (shape.y - area.top) * scale }),
    default: (scale, shape, area) => ({ y: area.bottom + (shape.y - area.bottom) * scale }),
  })
}