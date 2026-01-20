import { TransformDomain } from "../../domain/transform"
import { mapSelectedShapes, type ResizeSingleFromBoundParams } from "../../domain/transform/_types"

export const SingleShapeResize = {
  ViaBound: {
    Independent: {
      bottom: ({ shapes, cursor }: ResizeSingleFromBoundParams) => {
        return mapSelectedShapes(shapes, (shape) => ({
          ...shape,
          ...TransformDomain.Single.Resize.Independent.calcShapeBottomBoundResizePatch({ cursor, shape }),
        }))
      },

      right: ({ shapes, cursor }: ResizeSingleFromBoundParams) => {
        return mapSelectedShapes(shapes, (shape) => ({
          ...shape,
          ...TransformDomain.Single.Resize.Independent.calcShapeRightBoundResizePatch({ cursor, shape }),
        }))
      },

      left: ({ shapes, cursor }: ResizeSingleFromBoundParams) => {
        return mapSelectedShapes(shapes, (shape) => ({
          ...shape,
          ...TransformDomain.Single.Resize.Independent.calcShapeLeftBoundResizePatch({ cursor, shape }),
        }))
      },

      top: ({ shapes, cursor }: ResizeSingleFromBoundParams) => {
        return mapSelectedShapes(shapes, (shape) => ({
          ...shape,
          ...TransformDomain.Single.Resize.Independent.calcShapeTopBoundResizePatch({ cursor, shape }),
        }))
      }
      ,
    },

    Proportional: {
      bottom: ({ shapes, cursor }: ResizeSingleFromBoundParams) => {
        return mapSelectedShapes(shapes, (shape) => ({
          ...shape,
          ...TransformDomain.Single.Resize.Proportional.calcShapeBottomBoundAspectResizePatch({ cursor, shape }, {
            default: (shape) => ({ x: shape.x - (shape.nextWidth / 2 - shape.width / 2) }),
            flip: (shape) => ({ x: shape.x - (shape.nextWidth / 2 - shape.width / 2) }),
            frizen: (shape) => ({ x: shape.x + shape.width / 2 }),
          }),
        }))
      },

      right: ({ shapes, cursor }: ResizeSingleFromBoundParams) => {
        return mapSelectedShapes(shapes, (shape) => ({
          ...shape,
          ...TransformDomain.Single.Resize.Proportional.calcShapeRightBoundAspectResizePatch({ cursor, shape }, {
            default: (shape) => ({ y: shape.y - (shape.nextHeight / 2 - shape.height / 2) }),
            flip: (shape) => ({ y: shape.y - (shape.nextHeight / 2 - shape.height / 2) }),
            frizen: (shape) => ({ y: shape.y + shape.height / 2 }),
          }),
        }))
      },

      left: ({ shapes, cursor }: ResizeSingleFromBoundParams) => {
        return mapSelectedShapes(shapes, (shape) => ({
          ...shape,
          ...TransformDomain.Single.Resize.Proportional.calcShapeLeftBoundAspectResizePatch({ cursor, shape }, {
            default: (shape) => ({ y: shape.y - (shape.nextHeight / 2 - shape.height / 2) }),
            flip: (shape) => ({ y: shape.y - (shape.nextHeight / 2 - shape.height / 2) }),
            frizen: (shape) => ({ y: shape.y + shape.height / 2 })
          }),
        }))
      },

      top: ({ shapes, cursor }: ResizeSingleFromBoundParams) => {
        return mapSelectedShapes(shapes, (shape) => ({
          ...shape,

          ...TransformDomain.Single.Resize.Proportional.calcShapeTopBoundAspectResizePatch({ cursor, shape }, {
            default: (shape) => ({ x: shape.x - (shape.nextWidth / 2 - shape.width / 2) }),
            flip: (shape) => ({ x: shape.x - (shape.nextWidth / 2 - shape.width / 2) }),
            frizen: (shape) => ({ x: shape.x + shape.width / 2 }),
          }),
        }))
      }
      ,
    }
  },

  ViaCorner: {
    Independent: {
      bottomRight: ({ shapes, cursor }: ResizeSingleFromBoundParams) => {
        return mapSelectedShapes(shapes, (shape) => ({
          ...shape,
          ...TransformDomain.Single.Resize.Independent.calcShapeRightBoundResizePatch({ cursor, shape }),
          ...TransformDomain.Single.Resize.Independent.calcShapeBottomBoundResizePatch({ cursor, shape })
        }))
      },

      bottomLeft: ({ shapes, cursor }: ResizeSingleFromBoundParams) => {
        return mapSelectedShapes(shapes, (shape) => ({
          ...shape,
          ...TransformDomain.Single.Resize.Independent.calcShapeLeftBoundResizePatch({ cursor, shape }),
          ...TransformDomain.Single.Resize.Independent.calcShapeBottomBoundResizePatch({ cursor, shape })
        }))
      },

      topRight: ({ shapes, cursor }: ResizeSingleFromBoundParams) => {
        return mapSelectedShapes(shapes, (shape) => ({
          ...shape,
          ...TransformDomain.Single.Resize.Independent.calcShapeRightBoundResizePatch({ cursor, shape }),
          ...TransformDomain.Single.Resize.Independent.calcShapeTopBoundResizePatch({ cursor, shape })
        }))
      },

      topLeft: ({ shapes, cursor }: ResizeSingleFromBoundParams) => {
        return mapSelectedShapes(shapes, (shape) => ({
          ...shape,
          ...TransformDomain.Single.Resize.Independent.calcShapeLeftBoundResizePatch({ cursor, shape }),
          ...TransformDomain.Single.Resize.Independent.calcShapeTopBoundResizePatch({ cursor, shape })
        }))
      },
    },

    Proportional: {
      bottomRight: ({ shapes, cursor }: ResizeSingleFromBoundParams) => {
        return mapSelectedShapes(shapes, (shape) => ({
          ...shape,
          ...TransformDomain.Single.Resize.Proportional.calcShapeBottomBoundAspectResizePatch({ shape, cursor }, {
            flip: ({ x, nextWidth }) => ({ x: x - nextWidth })
          })
        }))
      },

      bottomLeft: ({ shapes, cursor }: ResizeSingleFromBoundParams) => {
        return mapSelectedShapes(shapes, (shape) => ({
          ...shape,
          ...TransformDomain.Single.Resize.Proportional.calcShapeBottomBoundAspectResizePatch({ shape, cursor }, {
            flip: ({ x, width }) => ({ x: x + width }),
            frizen: ({ x, width }) => ({ x: x + width }),
            default: ({ x, width, nextWidth }) => ({ x: x - (nextWidth - width) })
          })
        }))
      },

      topRight: ({ shapes, cursor }: ResizeSingleFromBoundParams) => {
        return mapSelectedShapes(shapes, (shape) => ({
          ...shape,
          ...TransformDomain.Single.Resize.Proportional.calcShapeTopBoundAspectResizePatch({ shape, cursor }, {
            flip: ({ x, nextWidth }) => ({ x: x - nextWidth })
          }),
        }))
      },

      topLeft: ({ shapes, cursor }: ResizeSingleFromBoundParams) => {
        return mapSelectedShapes(shapes, (shape) => ({
          ...shape,
          ...TransformDomain.Single.Resize.Proportional.calcShapeTopBoundAspectResizePatch({ shape, cursor }, {
            default: ({ x, width, nextWidth }) => ({ x: x - (nextWidth - width) }),
            frizen: ({ x, width }) => ({ x: x + width }),
            flip: ({ x, width }) => ({ x: x + width }),
          }),
        }))
      },
    }
  },
}
