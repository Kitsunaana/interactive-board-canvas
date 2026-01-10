import { match } from "@/shared/lib/match.ts";
import { addPoint } from "@/shared/lib/point.ts";
import { _u } from "@/shared/lib/utils.ts";
import type { Point } from "@/shared/type/shared.ts";
import { viewModelState$ } from "../view-model/state/_view-model";
import { goToIdle, type ViewModelState } from "../view-model/state/_view-model.type";
import type { Shape } from "./_shape";

export const startMoveShape = ({ event, point, shape }: {
  event: PointerEvent
  shape: Shape
  point: Point
}): ViewModelState => (
  match(viewModelState$.getValue(), {
    idle: (state) => state,

    nodesDragging: (state) => {
      const hasPressedKey = event.ctrlKey || event.shiftKey

      if (state.selectedIds.has(shape.id) || hasPressedKey) return state

      return {
        ...state,
        mouseDown: point,
        selectedIds: new Set(shape.id),
      }
    }
  })
)

export const movingShape = ({ shapes, distance, selectedIds }: {
  selectedIds: Set<string>
  distance: Point
  shapes: Shape[]
}) => shapes.map((shape) => (
  selectedIds.has(shape.id)
    ? _u.merge(shape, addPoint(shape, distance))
    : shape
))

export const endMoveShape = () => (
  match(viewModelState$.getValue(), {
    nodesDragging: ({ selectedIds }) => goToIdle({ selectedIds }),

    idle: (state) => state,
  })
)
