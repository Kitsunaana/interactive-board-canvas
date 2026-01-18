import { match } from "@/shared/lib/match"
import type { Rect } from "@/shared/type/shared"
import type { Selection } from "../../selection"
import type { NodeCorner } from "../../selection-area"
import type { ShapeToView } from "../../shape"
import type { ApplyEdgeResizeParams, ResizeInteraction, ResizeSingleFromEdgeParams } from "../_shared"
import { mapSelectedShapes } from "../_shared"
import { IndependentResize } from "../_single"

export const resizeFromBottomLeftCorner = ({ shapes, cursor }: ResizeSingleFromEdgeParams) => {
  return mapSelectedShapes(shapes, (shape) => ({
  ...shape,
  ...IndependentResize.applyLeftEdgeResize({ cursor, shape }),
  ...IndependentResize.applyBottomEdgeResize({ cursor, shape })
}))
}

export const resizeFromBottomRightCorner = ({ shapes, cursor }: ResizeSingleFromEdgeParams) => {
  return mapSelectedShapes(shapes, (shape) => ({
  ...shape,
  ...IndependentResize.applyRightEdgeResize({ cursor, shape }),
  ...IndependentResize.applyBottomEdgeResize({ cursor, shape })
}))
}

export const resizeFromTopLeftCorner = ({ shapes, cursor }: ResizeSingleFromEdgeParams) => {
  return mapSelectedShapes(shapes, (shape) => ({
  ...shape,
  ...IndependentResize.applyRightEdgeResize({ cursor, shape }),
  ...IndependentResize.applyBottomEdgeResize({ cursor, shape })
}))
}

export const resizeFromTopRightCorner = ({ shapes, cursor }: ResizeSingleFromEdgeParams) => {
  return mapSelectedShapes(shapes, (shape) => ({
  ...shape,
  ...IndependentResize.applyRightEdgeResize({ cursor, shape }),
  ...IndependentResize.applyBottomEdgeResize({ cursor, shape })
}))
}

export const getShapesResizeStrategyViaResizeHandler = ({ corner, shapes, selectedIds }: {
  selectedIds: Selection
  shapes: ShapeToView[]
  selectionArea: Rect
  corner: NodeCorner
}) => {
  if (selectedIds.size > 1) {

  }

  return match(corner, {
    bottomRight: () => ({ cursor }: ResizeInteraction) => resizeFromBottomRightCorner({ cursor, shapes }),
    bottomLeft: () => ({ cursor }: ResizeInteraction) => resizeFromBottomLeftCorner({ cursor, shapes }),
    topRight: () => ({ cursor }: ResizeInteraction) => resizeFromTopRightCorner({ cursor, shapes }),
    topLeft: () => ({ cursor }: ResizeInteraction) => resizeFromTopLeftCorner({ cursor, shapes }),
  }, "id")
}