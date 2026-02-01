import { getBoundingBox } from "@/entities/shape/model/get-bounding-box"
import { markDirty } from "@/entities/shape/model/render-state"
import type { ClientShape } from "@/entities/shape/model/types"
import { getAngleBetweenPoints } from "@/shared/lib/point"
import { centerPointFromRect } from "@/shared/lib/rect"
import { _u } from "@/shared/lib/utils"
import { goToShapesRotate } from "../../view-model/state/_view-model.type"
import { mapSelectedShapes } from "../resize/_strategy/_lib"
import type { RotateableShapesStrategy } from "./rotate-interface"

export const getSingleShapeRotateStrategy: RotateableShapesStrategy = ({ area, shapes, startCursor }) => {
  const center = centerPointFromRect(area)

  const startCursorAngle = getAngleBetweenPoints(center, startCursor)
  const rotatingShape = shapes.find((shape) => shape.client.isSelected) as ClientShape
  const startRotation = rotatingShape.transform.rotate

  rotatingShape.client.renderMode.kind = "vector"

  return {
    finish: () => markDirty(rotatingShape),

    goToRotate: () => goToShapesRotate({
      selectedIds: new Set([rotatingShape.id]),
      selection: {
        bounds: [],
        area: {
          ...getBoundingBox(rotatingShape.geometry, 0),
          rotate: rotatingShape.transform.rotate,
        }
      }
    }),

    rotate: ({ currentCursor }) => {
      const currentCursorAngle = getAngleBetweenPoints(center, currentCursor)

      const delta = currentCursorAngle - startCursorAngle
      const nextRotation = startRotation + delta

      return {
        nextState: (state) => (goToShapesRotate({
          ...state,
          selection: _u.merge(state.selection, {
            area: {
              ...state.selection.area,
              rotate: nextRotation,
            }
          })
        })),

        nextShapes: () => mapSelectedShapes(shapes, (shape) => ({
          ...shape,
          transform: _u.merge(shape.transform, {
            rotate: nextRotation
          })
        }))
      }
    }
  }
}