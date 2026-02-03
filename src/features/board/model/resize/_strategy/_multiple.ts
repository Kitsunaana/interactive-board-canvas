// import { TransformDomain } from "@/entities/shape"
// import type { ClientShape, RectangleGeometry } from "@/entities/shape/model/types"
// import { _u } from "@/shared/lib/utils"
// import type { Point, Rect, RectWithId } from "@/shared/type/shared"
// import { defaultTo } from "lodash"
// import { mapSelectedShapes } from "./_lib"

// export type ResizeMultipleFromBoundParams = {
//   selectedShapes: ClientShape[]
//   allShapes: ClientShape[]
//   selectionArea: Rect
//   cursor: Point
// }

// type AnyTransform = {
//   default: (...args: any[]) => Partial<Rect>
//   frizen: (...args: any[]) => Partial<Rect>
//   flip: (...args: any[]) => Partial<Rect>
// }

// type AnyCalcShapeFromBound = (
//   params: { selectionArea: Rect; shapes: RectWithId[]; cursor: Point },
//   transform?: AnyTransform
// ) => Map<string, Partial<Rect>>

// const factory = (list: AnyCalcShapeFromBound[], rules: (AnyTransform | null)[] = []) => {
//   return ({ selectedShapes, selectionArea, allShapes, cursor }: ResizeMultipleFromBoundParams): ClientShape[] => {
//     const patches = list.map((calculate, index) => {
//       const transform = defaultTo(rules[index], undefined)

//       return calculate({
//         cursor,
//         selectionArea,
//         shapes: selectedShapes.filter(shape => shape.geometry.kind === "rectangle-geometry").map((shape) => ({
//           ...shape.geometry as RectangleGeometry,
//           id: shape.id,
//         }))
//       }, transform)
//     })

//     return mapSelectedShapes(allShapes, (shape) => ({
//       ...shape,
//       geometry: {
//         ...shape.geometry,
//         ...patches.reduce((acc, patcher) => _u.merge(acc, defaultTo(patcher.get(shape.id), {})), {})
//       },
//     }) as ClientShape)
//   }
// }

// type CalcSelectionAspectResizePatchesTransform = NonNullable<Parameters<typeof TransformDomain.Multiple.Resize.Proportional.Short.bottom>[1]>

// const Rules = {
//   ScaleToXAxisCenterOppositeBound: {
//     default: (shape, aria, scale) => ({ x: aria.right / 2 + (shape.x - aria.right / 2) * scale }),
//     flip: (shape, aria, scale) => ({ x: aria.right / 2 + (shape.x - aria.right / 2) * scale }),
//     frizen: (_, aria) => ({ x: aria.right / 2 })
//   } satisfies CalcSelectionAspectResizePatchesTransform,

//   ScaleToYAxisCenterOppositeBound: {
//     default: (shape, aria, scale) => ({ y: aria.bottom / 2 + (shape.y - aria.bottom / 2) * scale }),
//     flip: (shape, aria, scale) => ({ y: aria.bottom / 2 + (shape.y - aria.bottom / 2) * scale }),
//     frizen: (_, aria) => ({ y: aria.bottom / 2 })
//   } satisfies CalcSelectionAspectResizePatchesTransform
// }

// const Resize = TransformDomain.Multiple.Resize
// const Reflow = TransformDomain.Multiple.Reflow

// export const MultipleShapesTransform = {
//   Resize: {
//     ViaBound: {
//       Independent: {
//         bottom: factory([Resize.Independent.Short.bottom]),
//         right: factory([Resize.Independent.Short.right]),
//         left: factory([Resize.Independent.Short.left]),
//         top: factory([Resize.Independent.Short.top]),
//       },

//       Proportional: {
//         bottom: factory([Resize.Proportional.Short.bottom], [Rules.ScaleToXAxisCenterOppositeBound]),
//         right: factory([Resize.Proportional.Short.right], [Rules.ScaleToYAxisCenterOppositeBound]),
//         left: factory([Resize.Proportional.Short.left], [Rules.ScaleToYAxisCenterOppositeBound]),
//         top: factory([Resize.Proportional.Short.top], [Rules.ScaleToXAxisCenterOppositeBound]),
//       }
//     },

//     ViaCorner: {
//       Independent: {
//         bottomRight: factory([Resize.Independent.Short.bottom, Resize.Independent.Short.right]),
//         bottomLeft: factory([Resize.Independent.Short.bottom, Resize.Independent.Short.left]),
//         topRight: factory([Resize.Independent.Short.top, Resize.Independent.Short.right]),
//         topLeft: factory([Resize.Independent.Short.top, Resize.Independent.Short.left]),
//       },

//       Proportional: {
//         bottomRight: factory([Resize.Proportional.Short.right]),
//         bottomLeft: factory([Resize.Proportional.Short.left]),
//         topLeft: factory([Resize.Proportional.Short.top]),
//         topRight: factory([Resize.Proportional.Short.right], [{
//           default: (shape, aria) => ({ y: aria.bottom + (shape.y - aria.bottom) * shape.scale }),
//           flip: (shape, aria) => ({ y: aria.bottom + (shape.y - aria.top) * shape.scale }),
//           frizen: (_, aria) => ({ y: aria.bottom }),
//         }]),
//       },
//     }
//   },

//   Reflow: {
//     ViaBound: {
//       Independent: {
//         bottom: factory([Reflow.Independent.Short.bottom]),
//         right: factory([Reflow.Independent.Short.right]),
//         left: factory([Reflow.Independent.Short.left]),
//         top: factory([Reflow.Independent.Short.top]),
//       },

//       Proportional: {
//         bottom: factory([Reflow.Proportional.Short.bottom]),
//         right: factory([Reflow.Proportional.Short.right]),
//         left: factory([Reflow.Proportional.Short.left]),
//         top: factory([Reflow.Proportional.Short.top]),
//       }
//     },

//     ViaCorner: {
//       Independent: {
//         bottomRight: factory([Reflow.Independent.Short.bottom, Reflow.Independent.Short.right]),
//         bottomLeft: factory([Reflow.Independent.Short.bottom, Reflow.Independent.Short.left]),
//         topRight: factory([Reflow.Independent.Short.top, Reflow.Independent.Short.right]),
//         topLeft: factory([Reflow.Independent.Short.top, Reflow.Independent.Short.left]),
//       },

//       Proportional: {
//         bottomRight: factory([Reflow.Proportional.Short.right]),
//         bottomLeft: factory([Reflow.Proportional.Short.left]),
//         topRight: factory([Reflow.Proportional.Short.top]),
//         topLeft: factory([Reflow.Proportional.Short.top]),
//       },
//     },
//   },
// }
