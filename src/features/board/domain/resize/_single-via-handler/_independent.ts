import type { ResizeSingleFromBoundParams } from "../_shared"
import { mapSelectedShapes } from "../_shared"
import { IndependentResize } from "../_single-via-bound"

export const resizeFromBottomLeftCorner = ({ shapes, cursor }: ResizeSingleFromBoundParams) => {
  return mapSelectedShapes(shapes, (shape) => ({
    ...shape,
    ...IndependentResize.applyLeftBoundResize({ cursor, shape }),
    ...IndependentResize.applyBottomBoundResize({ cursor, shape })
  }))
}

export const resizeFromBottomRightCorner = ({ shapes, cursor }: ResizeSingleFromBoundParams) => {
  return mapSelectedShapes(shapes, (shape) => ({
    ...shape,
    ...IndependentResize.applyRightBoundResize({ cursor, shape }),
    ...IndependentResize.applyBottomBoundResize({ cursor, shape })
  }))
}

export const resizeFromTopLeftCorner = ({ shapes, cursor }: ResizeSingleFromBoundParams) => {
  return mapSelectedShapes(shapes, (shape) => ({
    ...shape,
    ...IndependentResize.applyLeftBoundResize({ cursor, shape }),
    ...IndependentResize.applyTopBoundResize({ cursor, shape })
  }))
}

export const resizeFromTopRightCorner = ({ shapes, cursor }: ResizeSingleFromBoundParams) => {
  return mapSelectedShapes(shapes, (shape) => ({
    ...shape,
    ...IndependentResize.applyRightBoundResize({ cursor, shape }),
    ...IndependentResize.applyTopBoundResize({ cursor, shape })
  }))
}