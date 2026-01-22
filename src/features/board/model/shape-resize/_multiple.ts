import { _u } from "@/shared/lib/utils"
import type { Point, Rect } from "@/shared/type/shared"
import { defaultTo } from "lodash"
import type { ShapeToRender } from "../../domain/shape"
import { TransformDomain } from "../../domain/transform"
import type { CalcSelectionFromBoundAspectResizePatchesTransform, RectWithId } from "../../domain/transform/_types"
import { mapSelectedShapes } from "./_types"

export type ResizeMultipleFromBoundParams = {
  selectedShapes: ShapeToRender[]
  allShapes: ShapeToRender[]
  selectionArea: Rect
  cursor: Point
}

type AnyTransform = {
  default: (...args: any[]) => Partial<Rect>
  frizen: (...args: any[]) => Partial<Rect>
  flip: (...args: any[]) => Partial<Rect>
}

type AnyCalcShapeFromBound = (
  params: { selectionArea: Rect; shapes: RectWithId[]; cursor: Point },
  transform?: AnyTransform
) => Map<string, Partial<Rect>>

const factory = (list: AnyCalcShapeFromBound[], rules: (AnyTransform | null)[] = []) => {
  return ({ selectedShapes, selectionArea, allShapes, cursor }: ResizeMultipleFromBoundParams): ShapeToRender[] => {
    const patches = list.map((calculate, index) => {
      const transform = defaultTo(rules[index], undefined)

      return calculate({ cursor, selectionArea, shapes: selectedShapes }, transform)
    })

    return mapSelectedShapes(allShapes, (shape) => ({
      ...shape,
      ...patches.reduce((acc, patcher) => _u.merge(acc, defaultTo(patcher.get(shape.id), {})), {}),
    }))
  }
}

const Rules = {
  ScaleToXAxisCenterOppositeBound: {
    default: (shape, aria) => ({ x: aria.right / 2 + (shape.x - aria.right / 2) * shape.scale }),
    flip: (shape, aria) => ({ x: aria.right / 2 + (shape.x - aria.right / 2) * shape.scale }),
    frizen: (_, aria) => ({ x: aria.right / 2 })
  } satisfies CalcSelectionFromBoundAspectResizePatchesTransform,

  ScaleToYAxisCenterOppositeBound: {
    default: (shape, aria) => ({ y: aria.bottom / 2 + (shape.y - aria.bottom / 2) * shape.scale }),
    flip: (shape, aria) => ({ y: aria.bottom / 2 + (shape.y - aria.bottom / 2) * shape.scale }),
    frizen: (_, aria) => ({ y: aria.bottom / 2 })
  } satisfies CalcSelectionFromBoundAspectResizePatchesTransform
}

const Resize = TransformDomain.Multiple.Resize
const Reflow = TransformDomain.Multiple.Reflow

export const MultipleShapesTransform = {
  Resize: {
    ViaBound: {
      Independent: {
        bottom: factory([Resize.Independent.Short.bottom]),
        right: factory([Resize.Independent.Short.right]),
        left: factory([Resize.Independent.Short.left]),
        top: factory([Resize.Independent.Short.top]),
      },

      Proportional: {
        bottom: factory([Resize.Proportional.Short.bottom], [Rules.ScaleToXAxisCenterOppositeBound]),
        right: factory([Resize.Proportional.Short.right], [Rules.ScaleToYAxisCenterOppositeBound]),
        left: factory([Resize.Proportional.Short.left], [Rules.ScaleToYAxisCenterOppositeBound]),
        top: factory([Resize.Proportional.Short.top], [Rules.ScaleToXAxisCenterOppositeBound]),
      }
    },

    ViaCorner: {
      Independent: {
        bottomRight: factory([Resize.Independent.Short.bottom, Resize.Independent.Short.right]),
        bottomLeft: factory([Resize.Independent.Short.bottom, Resize.Independent.Short.left]),
        topRight: factory([Resize.Independent.Short.top, Resize.Independent.Short.right]),
        topLeft: factory([Resize.Independent.Short.top, Resize.Independent.Short.left]),
      },

      Proportional: {
        bottomRight: factory([Resize.Proportional.Short.right]),
        bottomLeft: factory([Resize.Proportional.Short.left]),
        topLeft: factory([Resize.Proportional.Short.top]),
        topRight: factory([Resize.Proportional.Short.right], [{
          default: (shape, aria) => ({ y: aria.bottom + (shape.y - aria.bottom) * shape.scale }),
          flip: (shape, aria) => ({ y: aria.bottom + (shape.y - aria.top) * shape.scale }),
          frizen: (_, aria) => ({ y: aria.bottom }),
        }]),
      },
    }
  },

  Reflow: {
    ViaBound: {
      Independent: {
        bottom: factory([Reflow.Independent.Short.bottom]),
        right: factory([Reflow.Independent.Short.right]),
        left: factory([Reflow.Independent.Short.left]),
        top: factory([Reflow.Independent.Short.top]),
      },

      Proportional: {
        bottom: factory([Reflow.Proportional.Short.bottom]),
        right: factory([Reflow.Proportional.Short.right]),
        left: factory([Reflow.Proportional.Short.left]),
        top: factory([Reflow.Proportional.Short.top]),
      }
    },

    ViaCorner: {
      Independent: {
        bottomRight: factory([Reflow.Independent.Short.bottom, Reflow.Independent.Short.right]),
        bottomLeft: factory([Reflow.Independent.Short.bottom, Reflow.Independent.Short.left]),
        topRight: factory([Reflow.Independent.Short.top, Reflow.Independent.Short.right]),
        topLeft: factory([Reflow.Independent.Short.top, Reflow.Independent.Short.left]),
      },

      Proportional: {
        bottomRight: factory([Reflow.Proportional.Short.right]),
        bottomLeft: factory([Reflow.Proportional.Short.left]),
        topRight: factory([Reflow.Proportional.Short.top]),
        topLeft: factory([Reflow.Proportional.Short.top]),
      },
    },
  },
}
