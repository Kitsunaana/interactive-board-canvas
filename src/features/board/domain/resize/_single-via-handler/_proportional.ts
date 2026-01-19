import type { ResizeSingleFromBoundParams } from "../_shared"
import { mapSelectedShapes } from "../_shared"
import { ProportionalResize } from "../_single-via-bound"

export const resizeFromBottomLeftCorner = ({ shapes, cursor }: ResizeSingleFromBoundParams) => {
  return mapSelectedShapes(shapes, (shape) => ({
    ...shape,
    ...ProportionalResize.applyBottomBoundResize({
      shape,
      cursor,
      flip: ({ x, width }) => ({ x: x + width }),
      frizen: ({ x, width }) => ({ x: x + width }),
      default: ({ x, width, nextWidth }) => ({ x: x - (nextWidth - width) })
    })
  }))
}

export const resizeFromBottomRightCorner = ({ shapes, cursor }: ResizeSingleFromBoundParams) => {
  return mapSelectedShapes(shapes, (shape) => ({
    ...shape,
    ...ProportionalResize.applyBottomBoundResize({
      shape,
      cursor,
      flip: ({ x, nextWidth }) => ({ x: x - nextWidth })
    })
  }))
}

export const resizeFromTopLeftCorner = ({ shapes, cursor }: ResizeSingleFromBoundParams) => {
  return mapSelectedShapes(shapes, (shape) => ({
    ...shape,
    ...ProportionalResize.applyTopBoundResize({
      shape,
      cursor,
      flip: ({ x, width }) => ({ x: x + width }),
      frizen: ({ x, width }) => ({ x: x + width }),
      default: ({ x, width, nextWidth }) => ({ x: x - (nextWidth - width) })
    }),
  }))
}

export const resizeFromTopRightCorner = ({ shapes, cursor }: ResizeSingleFromBoundParams) => {
  return mapSelectedShapes(shapes, (shape) => ({
    ...shape,
    ...ProportionalResize.applyTopBoundResize({
      shape,
      cursor,
      flip: ({ x, nextWidth }) => ({ x: x - nextWidth })
    }),
  }))
}