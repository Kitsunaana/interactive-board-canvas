import { TransformDomain } from "../../domain/transform"
import { mapSelectedShapes, type ResizeMultipleFromBoundParams } from "../../domain/transform/_types"

export const MultipleShapesTransform = {
  Resize: {
    ViaBound: {
      Independent: {
        bottom: (params: ResizeMultipleFromBoundParams) => {
          const pathces = TransformDomain.Multiple.Resize.Independent.calcSelectionBottomBoundResizePatches(params)

          return mapSelectedShapes(params.shapes, (shape) => ({
            ...shape,
            ...pathces.get(shape.id),
          }))
        },

        right: (params: ResizeMultipleFromBoundParams) => {
          const pathces = TransformDomain.Multiple.Resize.Independent.calcSelectionRightBoundResizePatches(params)

          return mapSelectedShapes(params.shapes, (shape) => ({
            ...shape,
            ...pathces.get(shape.id),
          }))
        },

        left: (params: ResizeMultipleFromBoundParams) => {
          const pathces = TransformDomain.Multiple.Resize.Independent.calcSelectionLeftBoundResizePatches(params)

          return mapSelectedShapes(params.shapes, (shape) => ({
            ...shape,
            ...pathces.get(shape.id),
          }))
        },

        top: (params: ResizeMultipleFromBoundParams) => {
          const pathces = TransformDomain.Multiple.Resize.Independent.calcSelectionTopBoundResizePatches(params)

          return mapSelectedShapes(params.shapes, (shape) => ({
            ...shape,
            ...pathces.get(shape.id),
          }))
        },
      },

      Proportional: {
        bottom: (params: ResizeMultipleFromBoundParams) => {
          const pathces = TransformDomain.Multiple.Resize.Proportional.calcSelectionBottomBoundAspectResizePatches(params)

          return mapSelectedShapes(params.shapes, (shape) => {
            return {
              ...shape,
              ...pathces.get(shape.id),
            }
          })
        },

        right: (params: ResizeMultipleFromBoundParams) => {
          const pathces = TransformDomain.Multiple.Resize.Proportional.calcSelectionRightBoundAspectResizePatches(params)

          return mapSelectedShapes(params.shapes, (shape) => {
            return {
              ...shape,
              ...pathces.get(shape.id),
            }
          })
        },

        left: (params: ResizeMultipleFromBoundParams) => {
          const pathces = TransformDomain.Multiple.Resize.Proportional.calcSelectionLeftBoundAspectResizePatches(params)

          return mapSelectedShapes(params.shapes, (shape) => {
            return {
              ...shape,
              ...pathces.get(shape.id),
            }
          })
        },

        top: (params: ResizeMultipleFromBoundParams) => {
          const pathces = TransformDomain.Multiple.Resize.Proportional.calcSelectionTopBoundAspectResizePatches(params)

          return mapSelectedShapes(params.shapes, (shape) => {
            return {
              ...shape,
              ...pathces.get(shape.id),
            }
          })
        },
      }
    },

    ViaCorner: {
      Independent: {
        bottomRight: (params: ResizeMultipleFromBoundParams) => {
          const patchesY = TransformDomain.Multiple.Resize.Independent.calcSelectionBottomBoundResizePatches(params)
          const patchesX = TransformDomain.Multiple.Resize.Independent.calcSelectionRightBoundResizePatches(params)

          return mapSelectedShapes(params.shapes, (shape) => ({
            ...shape,

            ...patchesY.get(shape.id),
            ...patchesX.get(shape.id),
          }))
        },

        bottomLeft: (params: ResizeMultipleFromBoundParams) => {
          const patchesY = TransformDomain.Multiple.Resize.Independent.calcSelectionBottomBoundResizePatches(params)
          const patchesX = TransformDomain.Multiple.Resize.Independent.calcSelectionLeftBoundResizePatches(params)

          return mapSelectedShapes(params.shapes, (shape) => ({
            ...shape,

            ...patchesY.get(shape.id),
            ...patchesX.get(shape.id),
          }))
        },

        topRight: (params: ResizeMultipleFromBoundParams) => {
          const patchesY = TransformDomain.Multiple.Resize.Independent.calcSelectionTopBoundResizePatches(params)
          const patchesX = TransformDomain.Multiple.Resize.Independent.calcSelectionRightBoundResizePatches(params)

          return mapSelectedShapes(params.shapes, (shape) => ({
            ...shape,

            ...patchesY.get(shape.id),
            ...patchesX.get(shape.id),
          }))
        },

        topLeft: (params: ResizeMultipleFromBoundParams) => {
          const patchesY = TransformDomain.Multiple.Resize.Independent.calcSelectionTopBoundResizePatches(params)
          const patchesX = TransformDomain.Multiple.Resize.Independent.calcSelectionLeftBoundResizePatches(params)

          return mapSelectedShapes(params.shapes, (shape) => ({
            ...shape,

            ...patchesY.get(shape.id),
            ...patchesX.get(shape.id),
          }))
        }
        ,
      },

      Proportional: {
        bottomRight: (params: ResizeMultipleFromBoundParams) => {
          const pathces = TransformDomain.Multiple.Resize.Proportional.calcSelectionRightBoundAspectResizePatches(params)

          return mapSelectedShapes(params.shapes, (shape) => {
            return {
              ...shape,
              ...pathces.get(shape.id),
            }
          })
        },
        
        bottomLeft: (params: ResizeMultipleFromBoundParams) => {
          const pathces = TransformDomain.Multiple.Resize.Proportional.calcSelectionLeftBoundAspectResizePatches(params)

          return mapSelectedShapes(params.shapes, (shape) => {
            return {
              ...shape,
              ...pathces.get(shape.id),
            }
          })
        },
        
        topRight: (params: ResizeMultipleFromBoundParams) => {
          const pathces = TransformDomain.Multiple.Resize.Proportional.calcSelectionRightBoundAspectResizePatches({
            ...params,

            default: (scale, shape, area) => ({ y: area.bottom + (shape.y - area.bottom) * scale }),
            flip: (scale, shape, area) => ({ y: area.bottom + (shape.y - area.top) * scale }),
            frizen: (_, __, area) => ({ y: area.bottom }),
          })

          return mapSelectedShapes(params.shapes, (shape) => {
            return {
              ...shape,
              ...pathces.get(shape.id),
            }
          })
        },
        
        topLeft: (params: ResizeMultipleFromBoundParams) => {
          const pathces = TransformDomain.Multiple.Resize.Proportional.calcSelectionTopBoundAspectResizePatches(params)

          return mapSelectedShapes(params.shapes, (shape) => {
            return {
              ...shape,
              ...pathces.get(shape.id),
            }
          })
        },
      },
    }
  },

  Reflow: {
    ViaBound: {
      Independent: {
        bottom: (params: ResizeMultipleFromBoundParams) => {
          const offsets = TransformDomain.Multiple.Reflow.Independent.calcSelectionBottomResizeOffsets(params)

          return mapSelectedShapes(params.shapes, (shape) => ({
            ...shape,
            ...offsets.get(shape.id),
          }))
        },

        right: (params: ResizeMultipleFromBoundParams) => {
          const offsets = TransformDomain.Multiple.Reflow.Independent.calcSelectionRightResizeOffsets(params)

          return mapSelectedShapes(params.shapes, (shape) => ({
            ...shape,
            ...offsets.get(shape.id),
          }))
        },

        left: (params: ResizeMultipleFromBoundParams) => {
          const offsets = TransformDomain.Multiple.Reflow.Independent.calcSelectionLeftResizeOffsets(params)

          return mapSelectedShapes(params.shapes, (shape) => ({
            ...shape,
            ...offsets.get(shape.id),
          }))
        },

        top: (params: ResizeMultipleFromBoundParams) => {
          const offsets = TransformDomain.Multiple.Reflow.Independent.calcSelectionTopResizeOffsets(params)

          return mapSelectedShapes(params.shapes, (shape) => ({
            ...shape,
            ...offsets.get(shape.id),
          }))
        },
      },

      Proportional: {
        bottom: (params: ResizeMultipleFromBoundParams) => {
          const pathces = TransformDomain.Multiple.Reflow.Proportional.calcSelectionBottomBoundReflowPatches(params)

          return mapSelectedShapes(params.shapes, (shape) => ({
            ...shape,
            ...pathces.get(shape.id),
          }))
        },

        right: (params: ResizeMultipleFromBoundParams) => {
          const pathces = TransformDomain.Multiple.Reflow.Proportional.calcSelectionRightBoundReflowPatches(params)

          return mapSelectedShapes(params.shapes, (shape) => ({
            ...shape,
            ...pathces.get(shape.id),
          }))
        },

        left: (params: ResizeMultipleFromBoundParams) => {
          const pathces = TransformDomain.Multiple.Reflow.Proportional.calcSelectionLeftBoundReflowPatches(params)

          return mapSelectedShapes(params.shapes, (shape) => ({
            ...shape,
            ...pathces.get(shape.id),
          }))
        },

        top: (params: ResizeMultipleFromBoundParams) => {
          const pathces = TransformDomain.Multiple.Reflow.Proportional.calcSelectionTopBoundReflowPatches(params)

          return mapSelectedShapes(params.shapes, (shape) => ({
            ...shape,
            ...pathces.get(shape.id),
          }))
        },
      }
    },

    ViaCorner: {
      Independent: {
        bottomRight: (params: ResizeMultipleFromBoundParams) => {
          const offsetsY = TransformDomain.Multiple.Reflow.Independent.calcSelectionBottomResizeOffsets(params)
          const offsetsX = TransformDomain.Multiple.Reflow.Independent.calcSelectionRightResizeOffsets(params)

          return mapSelectedShapes(params.shapes, (shape) => ({
            ...shape,
            ...offsetsY.get(shape.id),
            ...offsetsX.get(shape.id),
          }))
        },

        bottomLeft: (params: ResizeMultipleFromBoundParams) => {
          const offsetsY = TransformDomain.Multiple.Reflow.Independent.calcSelectionBottomResizeOffsets(params)
          const offsetsX = TransformDomain.Multiple.Reflow.Independent.calcSelectionLeftResizeOffsets(params)

          return mapSelectedShapes(params.shapes, (shape) => ({
            ...shape,
            ...offsetsY.get(shape.id),
            ...offsetsX.get(shape.id),
          }))
        },

        topRight: (params: ResizeMultipleFromBoundParams) => {
          const offsetsY = TransformDomain.Multiple.Reflow.Independent.calcSelectionTopResizeOffsets(params)
          const offsetsX = TransformDomain.Multiple.Reflow.Independent.calcSelectionRightResizeOffsets(params)

          return mapSelectedShapes(params.shapes, (shape) => ({
            ...shape,
            ...offsetsY.get(shape.id),
            ...offsetsX.get(shape.id),
          }))
        },

        topLeft: (params: ResizeMultipleFromBoundParams) => {
          const offsetsY = TransformDomain.Multiple.Reflow.Independent.calcSelectionTopResizeOffsets(params)
          const offsetsX = TransformDomain.Multiple.Reflow.Independent.calcSelectionLeftResizeOffsets(params)

          return mapSelectedShapes(params.shapes, (shape) => ({
            ...shape,
            ...offsetsY.get(shape.id),
            ...offsetsX.get(shape.id),
          }))
        },
      },

      Proportional: {
        bottomRight: (params: ResizeMultipleFromBoundParams) => {
          const patches = TransformDomain.Multiple.Reflow.Proportional.calcSelectionRightBoundReflowPatches(params)

          return mapSelectedShapes(params.shapes, (shape) => ({
            ...shape,
            ...patches.get(shape.id)
          }))
        },

        bottomLeft: (params: ResizeMultipleFromBoundParams) => {
          const patches = TransformDomain.Multiple.Reflow.Proportional.calcSelectionLeftBoundReflowPatches(params)

          return mapSelectedShapes(params.shapes, (shape) => ({
            ...shape,
            ...patches.get(shape.id)
          }))
        },

        topRight: (params: ResizeMultipleFromBoundParams) => {
          const patches = TransformDomain.Multiple.Reflow.Proportional.calcSelectionTopBoundReflowPatches(params)

          return mapSelectedShapes(params.shapes, (shape) => ({
            ...shape,
            ...patches.get(shape.id)
          }))
        },

        topLeft: (params: ResizeMultipleFromBoundParams) => {
          const patches = TransformDomain.Multiple.Reflow.Proportional.calcSelectionTopBoundReflowPatches(params)

          return mapSelectedShapes(params.shapes, (shape) => ({
            ...shape,
            ...patches.get(shape.id)
          }))
        },
      },
    },
  },
}
