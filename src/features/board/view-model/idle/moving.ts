import { match } from "@/shared/lib/match.ts";
import { addPoint } from "@/shared/lib/point.ts";
import { _u } from "@/shared/lib/utils.ts";
import type { Point } from "@/shared/type/shared.ts";
import type { Shape } from "../../domain/shape";
import type { ViewModelState } from "../state";
import { goToIdle, viewState$ } from "../state";

export const startMoveShape = ({ downEvent, startPoint, shape }: {
  downEvent: PointerEvent
  startPoint: Point,
  shape: Shape
}): ViewModelState => (
  match(viewState$.getValue(), {
    idle: (state) => state,

    shapesDragging: (state) => {
      const hasPressedKey = downEvent.ctrlKey || downEvent.shiftKey

      if (state.selectedIds.has(shape.id) || hasPressedKey) return state

      return {
        ...state,
        mouseDown: startPoint,
        selectedIds: new Set(shape.id),
      }
    }
  })
)

export const getMovedShapes = ({ shapes, distance, selectedIds }: {
  selectedIds: Set<string>
  distance: Point
  shapes: Shape[]
}) => shapes.map((shape) => (
  selectedIds.has(shape.id)
    ? _u.merge(shape, addPoint(shape, distance))
    : shape
))

export const endMoveShapes = () => (
  match(viewState$.getValue(), {
    shapesDragging: ({ selectedIds }) => goToIdle({ selectedIds }),

    idle: (state) => state,
  })
)
