import type { ResizeSingleFromEdgeParams } from "../_shared"
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
    ...IndependentResize.applyLeftEdgeResize({ cursor, shape }),
    ...IndependentResize.applyTopEdgeResize({ cursor, shape })
  }))
}

export const resizeFromTopRightCorner = ({ shapes, cursor }: ResizeSingleFromEdgeParams) => {
  return mapSelectedShapes(shapes, (shape) => ({
    ...shape,
    ...IndependentResize.applyRightEdgeResize({ cursor, shape }),
    ...IndependentResize.applyTopEdgeResize({ cursor, shape })
  }))
}