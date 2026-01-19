import { IndependentResize } from "../_multiple-via-bound"
import type { ResizeMultipleFromEdgeParams } from "../_shared"
import { mapSelectedShapes } from "../_shared"

export const resizeFromTopRightCorner = ({ cursor, shapes, selectionArea }: ResizeMultipleFromEdgeParams) => {
  const resizeYAxisShapes = IndependentResize.topWithFlipToBottom({ cursor, shapes, selectionArea })
  const resizeXAxisShapes = IndependentResize.rightWithFlipToLeft({ cursor, shapes, selectionArea })

  return mapSelectedShapes(shapes, (shape) => ({
    ...shape,

    ...resizeYAxisShapes.get(shape.id),
    ...resizeXAxisShapes.get(shape.id),
  }))
}

export const resizeFromTopLeftCorner = ({ cursor, shapes, selectionArea }: ResizeMultipleFromEdgeParams) => {
  const resizeYAxisShapes = IndependentResize.topWithFlipToBottom({ cursor, shapes, selectionArea })
  const resizeXAxisShapes = IndependentResize.leftWithFlipToRight({ cursor, shapes, selectionArea })

  return mapSelectedShapes(shapes, (shape) => ({
    ...shape,

    ...resizeYAxisShapes.get(shape.id),
    ...resizeXAxisShapes.get(shape.id),
  }))
}


export const resizeFromBottomLeftCorner = ({ cursor, shapes, selectionArea }: ResizeMultipleFromEdgeParams) => {
  const resizeYAxisShapes = IndependentResize.bottomWithFlipToTop({ cursor, shapes, selectionArea })
  const resizeXAxisShapes = IndependentResize.leftWithFlipToRight({ cursor, shapes, selectionArea })

  return mapSelectedShapes(shapes, (shape) => ({
    ...shape,

    ...resizeYAxisShapes.get(shape.id),
    ...resizeXAxisShapes.get(shape.id),
  }))
}

export const resizeFromBottomRightCorner = ({ cursor, shapes, selectionArea }: ResizeMultipleFromEdgeParams) => {
  const resizeYAxisShapes = IndependentResize.bottomWithFlipToTop({ cursor, shapes, selectionArea })
  const resizeXAxisShapes = IndependentResize.rightWithFlipToLeft({ cursor, shapes, selectionArea })

  return mapSelectedShapes(shapes, (shape) => ({
    ...shape,

    ...resizeYAxisShapes.get(shape.id),
    ...resizeXAxisShapes.get(shape.id),
  }))
}