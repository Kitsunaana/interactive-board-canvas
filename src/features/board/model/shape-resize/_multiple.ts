import type { Point, Rect } from "@/shared/type/shared"
import type { ShapeToView } from "../../domain/shape"
import { TransformDomain } from "../../domain/transform"
import { mapSelectedShapes } from "./_types"

export type ResizeMultipleFromBoundParams = {
  selectedShapes: ShapeToView[]
  allShapes: ShapeToView[]
  selectionArea: Rect
  cursor: Point
}

export const MultipleShapesTransform = {
  Resize: {
    ViaBound: {
      Independent: {
        bottom: ({ allShapes, selectedShapes, ...params }: ResizeMultipleFromBoundParams): ShapeToView[] => {
          const pathces = TransformDomain.Multiple.Resize.Independent.calcSelectionBottomBoundResizePatches({
            ...params,
            shapes: selectedShapes,
          })

          return mapSelectedShapes(allShapes, (shape) => ({
            ...shape,
            ...pathces.get(shape.id),
          }))
        },

        right: ({ allShapes, selectedShapes, ...params }: ResizeMultipleFromBoundParams): ShapeToView[] => {
          const pathces = TransformDomain.Multiple.Resize.Independent.calcSelectionRightBoundResizePatches({
            ...params,
            shapes: selectedShapes,
          })

          return mapSelectedShapes(allShapes, (shape) => ({
            ...shape,
            ...pathces.get(shape.id),
          }))
        },

        left: ({ allShapes, selectedShapes, ...params }: ResizeMultipleFromBoundParams): ShapeToView[] => {
          const pathces = TransformDomain.Multiple.Resize.Independent.calcSelectionLeftBoundResizePatches({
            ...params,
            shapes: selectedShapes,
          })

          return mapSelectedShapes(allShapes, (shape) => ({
            ...shape,
            ...pathces.get(shape.id),
          }))
        },

        top: ({ allShapes, selectedShapes, ...params }: ResizeMultipleFromBoundParams): ShapeToView[] => {
          const pathces = TransformDomain.Multiple.Resize.Independent.calcSelectionTopBoundResizePatches({
            ...params,
            shapes: selectedShapes,
          })

          return mapSelectedShapes(allShapes, (shape) => ({
            ...shape,
            ...pathces.get(shape.id),
          }))
        },
      },

      Proportional: {
        bottom: ({ allShapes, selectedShapes, ...params }: ResizeMultipleFromBoundParams): ShapeToView[] => {
          const right = params.selectionArea.x + params.selectionArea.width

          const pathces = TransformDomain.Multiple.Resize.Proportional.calcSelectionBottomBoundAspectResizePatches(
            {
              ...params,
              shapes: selectedShapes,
            },
            {
              default: (shape) => ({ x: right / 2 + (shape.x - right / 2) * shape.scale }),
              flip: (shape) => ({ x: right / 2 + (shape.x - right / 2) * shape.scale }),
              frizen: () => ({ x: right / 2 })
            })

          return mapSelectedShapes(allShapes, (shape) => ({
            ...shape,
            ...pathces.get(shape.id),
          }))
        },

        right: ({ allShapes, selectedShapes, ...params }: ResizeMultipleFromBoundParams): ShapeToView[] => {
          const bottom = params.selectionArea.y + params.selectionArea.height

          const pathces = TransformDomain.Multiple.Resize.Proportional.calcSelectionRightBoundAspectResizePatches(
            {
              ...params,
              shapes: selectedShapes,
            },
            {
              default: (shape) => ({ y: bottom / 2 + (shape.y - bottom / 2) * shape.scale }),
              flip: (shape) => ({ y: bottom / 2 + (shape.y - bottom / 2) * shape.scale }),
              frizen: () => ({ y: bottom / 2 })
            })

          return mapSelectedShapes(allShapes, (shape) => ({
            ...shape,
            ...pathces.get(shape.id),
          }))
        },

        left: ({ allShapes, selectedShapes, ...params }: ResizeMultipleFromBoundParams): ShapeToView[] => {
          const bottom = params.selectionArea.y + params.selectionArea.height

          const pathces = TransformDomain.Multiple.Resize.Proportional.calcSelectionLeftBoundAspectResizePatches(
            {
              ...params,
              shapes: selectedShapes,
            },
            {
              default: (shape) => ({ y: bottom / 2 + (shape.y - bottom / 2) * shape.scale }),
              flip: (shape) => ({ y: bottom / 2 + (shape.y - bottom / 2) * shape.scale }),
              frizen: () => ({ y: bottom / 2 })
            })

          return mapSelectedShapes(allShapes, (shape) => ({
            ...shape,
            ...pathces.get(shape.id),
          }))
        },

        top: ({ allShapes, selectedShapes, ...params }: ResizeMultipleFromBoundParams): ShapeToView[] => {
          const right = params.selectionArea.x + params.selectionArea.width

          const pathces = TransformDomain.Multiple.Resize.Proportional.calcSelectionTopBoundAspectResizePatches(
            {
              ...params,
              shapes: selectedShapes,
            },
            {
              default: (shape) => ({ x: right / 2 + (shape.x - right / 2) * shape.scale }),
              flip: (shape) => ({ x: right / 2 + (shape.x - right / 2) * shape.scale }),
              frizen: () => ({ x: right / 2 })
            })

          return mapSelectedShapes(allShapes, (shape) => ({
            ...shape,
            ...pathces.get(shape.id),
          }))
        },
      }
    },

    ViaCorner: {
      Independent: {
        bottomRight: ({ allShapes, selectedShapes, ...params }: ResizeMultipleFromBoundParams): ShapeToView[] => {
          const patchesY = TransformDomain.Multiple.Resize.Independent.calcSelectionBottomBoundResizePatches({
            ...params,
            shapes: selectedShapes,
          })

          const patchesX = TransformDomain.Multiple.Resize.Independent.calcSelectionRightBoundResizePatches({
            ...params,
            shapes: selectedShapes,
          })

          return mapSelectedShapes(allShapes, (shape) => ({
            ...shape,

            ...patchesY.get(shape.id),
            ...patchesX.get(shape.id),
          }))
        },

        bottomLeft: ({ allShapes, selectedShapes, ...params }: ResizeMultipleFromBoundParams): ShapeToView[] => {
          const patchesY = TransformDomain.Multiple.Resize.Independent.calcSelectionBottomBoundResizePatches({
            ...params,
            shapes: selectedShapes,
          })
          const patchesX = TransformDomain.Multiple.Resize.Independent.calcSelectionLeftBoundResizePatches({
            ...params,
            shapes: selectedShapes,
          })

          return mapSelectedShapes(allShapes, (shape) => ({
            ...shape,

            ...patchesY.get(shape.id),
            ...patchesX.get(shape.id),
          }))
        },

        topRight: ({ allShapes, selectedShapes, ...params }: ResizeMultipleFromBoundParams): ShapeToView[] => {
          const patchesY = TransformDomain.Multiple.Resize.Independent.calcSelectionTopBoundResizePatches({
            ...params,
            shapes: selectedShapes,
          })
          const patchesX = TransformDomain.Multiple.Resize.Independent.calcSelectionRightBoundResizePatches({
            ...params,
            shapes: selectedShapes,
          })

          return mapSelectedShapes(allShapes, (shape) => ({
            ...shape,

            ...patchesY.get(shape.id),
            ...patchesX.get(shape.id),
          }))
        },

        topLeft: ({ allShapes, selectedShapes, ...params }: ResizeMultipleFromBoundParams): ShapeToView[] => {
          const patchesY = TransformDomain.Multiple.Resize.Independent.calcSelectionTopBoundResizePatches({
            ...params,
            shapes: selectedShapes,
          })
          const patchesX = TransformDomain.Multiple.Resize.Independent.calcSelectionLeftBoundResizePatches({
            ...params,
            shapes: selectedShapes,
          })

          return mapSelectedShapes(allShapes, (shape) => ({
            ...shape,

            ...patchesY.get(shape.id),
            ...patchesX.get(shape.id),
          }))
        }
        ,
      },

      Proportional: {
        bottomRight: ({ allShapes, selectedShapes, ...params }: ResizeMultipleFromBoundParams): ShapeToView[] => {
          const pathces = TransformDomain.Multiple.Resize.Proportional.calcSelectionRightBoundAspectResizePatches({
            ...params,
            shapes: selectedShapes,
          })

          return mapSelectedShapes(allShapes, (shape) => {
            return {
              ...shape,
              ...pathces.get(shape.id),
            }
          })
        },

        bottomLeft: ({ allShapes, selectedShapes, ...params }: ResizeMultipleFromBoundParams): ShapeToView[] => {
          const pathces = TransformDomain.Multiple.Resize.Proportional.calcSelectionLeftBoundAspectResizePatches({
            ...params,
            shapes: selectedShapes,
          })

          return mapSelectedShapes(allShapes, (shape) => {
            return {
              ...shape,
              ...pathces.get(shape.id),
            }
          })
        },

        topRight: ({ allShapes, selectedShapes, ...params }: ResizeMultipleFromBoundParams): ShapeToView[] => {
          const top = params.selectionArea.y
          const bottom = top + params.selectionArea.height

          const pathces = TransformDomain.Multiple.Resize.Proportional.calcSelectionRightBoundAspectResizePatches(
            {
              ...params,
              shapes: selectedShapes,
            },
            {
              default: (shape) => ({ y: bottom + (shape.y - bottom) * shape.scale }),
              flip: (shape) => ({ y: bottom + (shape.y - top) * shape.scale }),
              frizen: () => ({ y: bottom }),
            })

          return mapSelectedShapes(allShapes, (shape) => {
            return {
              ...shape,
              ...pathces.get(shape.id),
            }
          })
        },

        topLeft: ({ allShapes, selectedShapes, ...params }: ResizeMultipleFromBoundParams): ShapeToView[] => {
          const pathces = TransformDomain.Multiple.Resize.Proportional.calcSelectionTopBoundAspectResizePatches({
            ...params,
            shapes: selectedShapes,
          })

          return mapSelectedShapes(allShapes, (shape) => {
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
        bottom: ({ allShapes, selectedShapes, ...params }: ResizeMultipleFromBoundParams): ShapeToView[] => {
          const offsets = TransformDomain.Multiple.Reflow.Independent.calcSelectionBottomResizeOffsets({
            ...params,
            shapes: selectedShapes,
          })

          return mapSelectedShapes(allShapes, (shape) => ({
            ...shape,
            ...offsets.get(shape.id),
          }))
        },

        right: ({ allShapes, selectedShapes, ...params }: ResizeMultipleFromBoundParams): ShapeToView[] => {
          const offsets = TransformDomain.Multiple.Reflow.Independent.calcSelectionRightResizeOffsets({
            ...params,
            shapes: selectedShapes,
          })

          return mapSelectedShapes(allShapes, (shape) => ({
            ...shape,
            ...offsets.get(shape.id),
          }))
        },

        left: ({ allShapes, selectedShapes, ...params }: ResizeMultipleFromBoundParams): ShapeToView[] => {
          const offsets = TransformDomain.Multiple.Reflow.Independent.calcSelectionLeftResizeOffsets({
            ...params,
            shapes: selectedShapes,
          })

          return mapSelectedShapes(allShapes, (shape) => ({
            ...shape,
            ...offsets.get(shape.id),
          }))
        },

        top: ({ allShapes, selectedShapes, ...params }: ResizeMultipleFromBoundParams): ShapeToView[] => {
          const offsets = TransformDomain.Multiple.Reflow.Independent.calcSelectionTopResizeOffsets({
            ...params,
            shapes: selectedShapes,
          })

          return mapSelectedShapes(allShapes, (shape) => ({
            ...shape,
            ...offsets.get(shape.id),
          }))
        },
      },

      Proportional: {
        bottom: ({ allShapes, selectedShapes, ...params }: ResizeMultipleFromBoundParams): ShapeToView[] => {
          const pathces = TransformDomain.Multiple.Reflow.Proportional.calcSelectionBottomBoundReflowPatches({
            ...params,
            shapes: selectedShapes,
          })

          return mapSelectedShapes(allShapes, (shape) => ({
            ...shape,
            ...pathces.get(shape.id),
          }))
        },

        right: ({ allShapes, selectedShapes, ...params }: ResizeMultipleFromBoundParams): ShapeToView[] => {
          const pathces = TransformDomain.Multiple.Reflow.Proportional.calcSelectionRightBoundReflowPatches({
            ...params,
            shapes: selectedShapes,
          })

          return mapSelectedShapes(allShapes, (shape) => ({
            ...shape,
            ...pathces.get(shape.id),
          }))
        },

        left: ({ allShapes, selectedShapes, ...params }: ResizeMultipleFromBoundParams): ShapeToView[] => {
          const pathces = TransformDomain.Multiple.Reflow.Proportional.calcSelectionLeftBoundReflowPatches({
            ...params,
            shapes: selectedShapes,
          })

          return mapSelectedShapes(allShapes, (shape) => ({
            ...shape,
            ...pathces.get(shape.id),
          }))
        },

        top: ({ allShapes, selectedShapes, ...params }: ResizeMultipleFromBoundParams): ShapeToView[] => {
          const pathces = TransformDomain.Multiple.Reflow.Proportional.calcSelectionTopBoundReflowPatches({
            ...params,
            shapes: selectedShapes,
          })

          return mapSelectedShapes(allShapes, (shape) => ({
            ...shape,
            ...pathces.get(shape.id),
          }))
        },
      }
    },

    ViaCorner: {
      Independent: {
        bottomRight: ({ allShapes, selectedShapes, ...params }: ResizeMultipleFromBoundParams): ShapeToView[] => {
          const offsetsY = TransformDomain.Multiple.Reflow.Independent.calcSelectionBottomResizeOffsets({
            ...params,
            shapes: selectedShapes,
          })
          const offsetsX = TransformDomain.Multiple.Reflow.Independent.calcSelectionRightResizeOffsets({
            ...params,
            shapes: selectedShapes,
          })

          return mapSelectedShapes(allShapes, (shape) => ({
            ...shape,
            ...offsetsY.get(shape.id),
            ...offsetsX.get(shape.id),
          }))
        },

        bottomLeft: ({ allShapes, selectedShapes, ...params }: ResizeMultipleFromBoundParams): ShapeToView[] => {
          const offsetsY = TransformDomain.Multiple.Reflow.Independent.calcSelectionBottomResizeOffsets({
            ...params,
            shapes: selectedShapes,
          })
          const offsetsX = TransformDomain.Multiple.Reflow.Independent.calcSelectionLeftResizeOffsets({
            ...params,
            shapes: selectedShapes,
          })

          return mapSelectedShapes(allShapes, (shape) => ({
            ...shape,
            ...offsetsY.get(shape.id),
            ...offsetsX.get(shape.id),
          }))
        },

        topRight: ({ allShapes, selectedShapes, ...params }: ResizeMultipleFromBoundParams): ShapeToView[] => {
          const offsetsY = TransformDomain.Multiple.Reflow.Independent.calcSelectionTopResizeOffsets({
            ...params,
            shapes: selectedShapes,
          })
          const offsetsX = TransformDomain.Multiple.Reflow.Independent.calcSelectionRightResizeOffsets({
            ...params,
            shapes: selectedShapes,
          })

          return mapSelectedShapes(allShapes, (shape) => ({
            ...shape,
            ...offsetsY.get(shape.id),
            ...offsetsX.get(shape.id),
          }))
        },

        topLeft: ({ allShapes, selectedShapes, ...params }: ResizeMultipleFromBoundParams): ShapeToView[] => {
          const offsetsY = TransformDomain.Multiple.Reflow.Independent.calcSelectionTopResizeOffsets({
            ...params,
            shapes: selectedShapes,
          })
          const offsetsX = TransformDomain.Multiple.Reflow.Independent.calcSelectionLeftResizeOffsets({
            ...params,
            shapes: selectedShapes,
          })

          return mapSelectedShapes(allShapes, (shape) => ({
            ...shape,
            ...offsetsY.get(shape.id),
            ...offsetsX.get(shape.id),
          }))
        },
      },

      Proportional: {
        bottomRight: ({ allShapes, selectedShapes, ...params }: ResizeMultipleFromBoundParams): ShapeToView[] => {
          const patches = TransformDomain.Multiple.Reflow.Proportional.calcSelectionRightBoundReflowPatches({
            ...params,
            shapes: selectedShapes,
          })

          return mapSelectedShapes(allShapes, (shape) => ({
            ...shape,
            ...patches.get(shape.id)
          }))
        },

        bottomLeft: ({ allShapes, selectedShapes, ...params }: ResizeMultipleFromBoundParams): ShapeToView[] => {
          const patches = TransformDomain.Multiple.Reflow.Proportional.calcSelectionLeftBoundReflowPatches({
            ...params,
            shapes: selectedShapes,
          })

          return mapSelectedShapes(allShapes, (shape) => ({
            ...shape,
            ...patches.get(shape.id)
          }))
        },

        topRight: ({ allShapes, selectedShapes, ...params }: ResizeMultipleFromBoundParams): ShapeToView[] => {
          const patches = TransformDomain.Multiple.Reflow.Proportional.calcSelectionTopBoundReflowPatches({
            ...params,
            shapes: selectedShapes,
          })

          return mapSelectedShapes(allShapes, (shape) => ({
            ...shape,
            ...patches.get(shape.id)
          }))
        },

        topLeft: ({ allShapes, selectedShapes, ...params }: ResizeMultipleFromBoundParams): ShapeToView[] => {
          const patches = TransformDomain.Multiple.Reflow.Proportional.calcSelectionTopBoundReflowPatches({
            ...params,
            shapes: selectedShapes,
          })

          return mapSelectedShapes(allShapes, (shape) => ({
            ...shape,
            ...patches.get(shape.id)
          }))
        },
      },
    },
  },
}
