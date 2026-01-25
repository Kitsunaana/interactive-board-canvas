import { _u } from "@/shared/lib/utils"
import type { Point, Rect, RectWithId } from "@/shared/type/shared"
import { defaultTo } from "lodash"
import type { ShapeToRender } from "../../../domain/shape"
import type { ResizeSingleFromBoundParams } from "./_lib"
import { mapSelectedShapes } from "./_lib"
import { TransformDomain } from "@/entities/shape"

type AnyTransform = {
  default: (...args: any[]) => Partial<Rect>
  frizen: (...args: any[]) => Partial<Rect>
  flip: (...args: any[]) => Partial<Rect>
}

type AnyCalcShapeFromBound = (
  params: { shape: RectWithId; cursor: Point },
  transform?: AnyTransform
) => Partial<Rect>

const factory = (list: AnyCalcShapeFromBound[], rules: (AnyTransform | null)[] = []) => {
  return ({ shapes, cursor }: ResizeSingleFromBoundParams): ShapeToRender[] => {
    return mapSelectedShapes(shapes, (shape) => (
      _u.merge(shape, list.reduce((acc, current, index) => {
        const transform = defaultTo(rules[index], undefined)

        return {
          ...acc,
          ...current({ cursor, shape }, transform)
        }
      }, {}))
    ))
  }
}

type CalcShapeAspectResizePatchTransform = NonNullable<Parameters<typeof TransformDomain.Single.Resize.Proportional.Short.bottom>[1]>

const Rules = {
  ScaleToXAxisCenterOppositeBound: {
    default: (shape) => ({ x: shape.x - (shape.nextWidth / 2 - shape.width / 2) }),
    flip: (shape) => ({ x: shape.x - (shape.nextWidth / 2 - shape.width / 2) }),
    frizen: (shape) => ({ x: shape.x + shape.width / 2 }),
  } satisfies CalcShapeAspectResizePatchTransform,

  ScaleToYAxisCenterOppositeBound: {
    default: (shape) => ({ y: shape.y - (shape.nextHeight / 2 - shape.height / 2) }),
    flip: (shape) => ({ y: shape.y - (shape.nextHeight / 2 - shape.height / 2) }),
    frizen: (shape) => ({ y: shape.y + shape.height / 2 }),
  } satisfies CalcShapeAspectResizePatchTransform
}

const Resize = TransformDomain.Single.Resize

export const SingleShapeResize = {
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
      bottomRight: factory([Resize.Independent.Short.right, Resize.Independent.Short.bottom]),
      bottomLeft: factory([Resize.Independent.Short.left, Resize.Independent.Short.bottom]),
      topRight: factory([Resize.Independent.Short.right, Resize.Independent.Short.top]),
      topLeft: factory([Resize.Independent.Short.left, Resize.Independent.Short.top]),
    },

    Proportional: {
      bottomRight: factory([Resize.Proportional.Short.bottom], [{
        flip: (shape) => ({ x: shape.x - shape.nextWidth }),
        default: () => ({}),
        frizen: () => ({}),
      }]),

      bottomLeft: factory([Resize.Proportional.Short.bottom], [{
        default: (shape) => ({ x: shape.x - (shape.nextWidth - shape.width) }),
        frizen: (shape) => ({ x: shape.x + shape.width }),
        flip: (shape) => ({ x: shape.x + shape.width }),
      }]),

      topRight: factory([Resize.Proportional.Short.top], [{
        flip: (shape) => ({ x: shape.x - shape.nextWidth }),
        default: () => ({}),
        frizen: () => ({}),
      }]),

      topLeft: factory([Resize.Proportional.Short.top], [{
        default: (shape) => ({ x: shape.x - (shape.nextWidth - shape.width) }),
        frizen: (shape) => ({ x: shape.x + shape.width }),
        flip: (shape) => ({ x: shape.x + shape.width }),
      }]),
    }
  },
}
