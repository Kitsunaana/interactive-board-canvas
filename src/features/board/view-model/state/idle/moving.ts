import { generateRectSketchProps } from "@/features/board/domain/sticker.ts";
import { match } from "@/shared/lib/match.ts";
import { addPoint, getPointFromEvent, screenToCanvas, subtractPoint } from "@/shared/lib/point.ts";
import { _u } from "@/shared/lib/utils.ts";
import type { Point } from "@/shared/type/shared.ts";
import type { Shape } from "../../../domain/dto.ts";
import type { Camera } from "../../../modules/_camera";
import { viewModelState$ } from "../index.ts";
import { goToIdle, type ViewModelState } from "../type.ts";

export const moveSelectedShapes = ({ camera, shapes, point, event, selectedIds }: {
  selectedIds: Set<string>
  event: PointerEvent
  shapes: Shape[]
  camera: Camera
  point: Point
}) => {
  const distance = subtractPoint(point, screenToCanvas({
    point: getPointFromEvent(event),
    camera,
  }))

  return shapes.map((node) => {
    if (selectedIds.has(node.id)) {
      const endPoint = addPoint(node, distance)

      return match(node, {
        arrow: () => node,

        circle: () => node,

        square: () => node,

        rectangle: (rectangle) => {
          if (rectangle.sketch) {
            const moved = _u.merge(rectangle, endPoint)

            return _u.merge(moved, generateRectSketchProps(moved))
          }

          return _u.merge(rectangle, endPoint)
        }
      })
    }

    return node
  })
}

export const startMoveSticker = ({ event, point, shape }: {
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

export const movingSticker = ({ shapes, camera, point, event }: {
  event: PointerEvent
  shapes: Shape[]
  camera: Camera
  point: Point
}) => (
  match(viewModelState$.getValue(), {
    idle: () => shapes,

    nodesDragging: ({ selectedIds }) => (
      moveSelectedShapes({
        selectedIds,
        shapes: shapes,
        camera,
        point,
        event
      })
    )
  })
)

export const endMoveSticker = () => (
  match(viewModelState$.getValue(), {
    nodesDragging: ({ selectedIds }) => goToIdle({ selectedIds }),

    idle: (state) => state,
  })
)
