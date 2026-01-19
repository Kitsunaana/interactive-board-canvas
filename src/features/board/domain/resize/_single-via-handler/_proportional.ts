import type { ResizeSingleFromEdgeParams } from "../_shared"
import { mapSelectedShapes } from "../_shared"
import { ProportionalResize } from "../_single-via-bound"

export const resizeFromBottomLeftCorner = ({ shapes, cursor }: ResizeSingleFromEdgeParams) => {
  return mapSelectedShapes(shapes, (shape) => ({
    ...shape,
    ...ProportionalResize.applyBottomEdgeResize({
      shape,
      cursor,
      flip: ({ x, width }) => ({ x: x + width }),
      frizen: ({ x, width }) => ({ x: x + width }),
      default: ({ x, width, nextWidth }) => ({ x: x - (nextWidth - width) })
    })
  }))
}

export const resizeFromBottomRightCorner = ({ shapes, cursor }: ResizeSingleFromEdgeParams) => {
  return mapSelectedShapes(shapes, (shape) => ({
    ...shape,
    ...ProportionalResize.applyBottomEdgeResize({
      shape,
      cursor,
      flip: ({ x, nextWidth }) => ({ x: x - nextWidth })
    })
  }))
}

export const resizeFromTopLeftCorner = ({ shapes, cursor }: ResizeSingleFromEdgeParams) => {
  return mapSelectedShapes(shapes, (shape) => ({
    ...shape,
    ...ProportionalResize.applyTopEdgeResize({
      shape,
      cursor,
      flip: ({ x, width }) => ({ x: x + width }),
      frizen: ({ x, width }) => ({ x: x + width }),
      default: ({ x, width, nextWidth }) => ({ x: x - (nextWidth - width) })
    }),
  }))
}

export const resizeFromTopRightCorner = ({ shapes, cursor }: ResizeSingleFromEdgeParams) => {
  return mapSelectedShapes(shapes, (shape) => ({
    ...shape,
    ...ProportionalResize.applyTopEdgeResize({
      shape,
      cursor,
      flip: ({ x, nextWidth }) => ({ x: x - nextWidth })
    }),
  }))
}