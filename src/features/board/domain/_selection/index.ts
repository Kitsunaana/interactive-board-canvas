import { left, right } from "@/shared/lib/either"
import { calculateLimitPoints, inferRect } from "@/shared/lib/rect"
import type { Rect } from "@/shared/type/shared"
import type { IdleViewState } from "../../view-model/state/_view-model.type"
import type { Shape, ShapeToView } from "../_shape"
import type { Selection, SelectionModifier } from "./_selection.type"

export const selectItems = ({ ids, modif, initialSelected }: {
  initialSelected: Selection
  modif: SelectionModifier
  ids: string[]
}) => {
  if (modif === "replace") return new Set(ids)

  if (modif === "add") return new Set([...initialSelected, ...ids])

  if (modif === "toggle") {
    const newIds = new Set(ids)

    const base = Array.from(initialSelected).filter((id) => !newIds.has(id))
    const added = ids.filter((id) => !initialSelected.has(id))

    return new Set(base.concat(added))
  }

  return initialSelected
}

export const shapeSelect = ({ event, shapeId, idleState }: {
  idleState: IdleViewState
  event: PointerEvent
  shapeId: string
}): IdleViewState => {
  if (idleState.selectedIds.has(shapeId) && !event.ctrlKey) return idleState

  return {
    ...idleState,
    selectedIds: selectItems({
      modif: event.ctrlKey ? "toggle" : "replace",
      initialSelected: idleState.selectedIds,
      ids: [shapeId],
    })
  }
}

export const computeSelectionBoundsRect = ({ shapes, selectedIds }: {
  selectedIds: Set<string>
  shapes: Shape[]
}) => {
  if (selectedIds.size === 1) {
    const selected = shapes.find((node) => selectedIds.has(node.id))

    if (selected === undefined) return left(null)

    return right({
      bounds: [] satisfies Rect[],
      area: inferRect(selected)
    })
  }

  if (selectedIds.size > 1) {
    const selecteds = shapes.filter((node) => selectedIds.has(node.id)).map(inferRect)

    const limitPoints = calculateLimitPoints({ rects: selecteds })

    return right({
      bounds: selecteds,
      area: {
        height: limitPoints.max.y - limitPoints.min.y,
        width: limitPoints.max.x - limitPoints.min.x,
        x: limitPoints.min.x,
        y: limitPoints.min.y,
      }
    })
  }

  return left(null)
}

export const computeSelectionBoundsArea = (shapes: ShapeToView[]) => {
  const selectedShapes = shapes.filter(shape => shape.isSelected)

  if (selectedShapes.length === 1) {
    return {
      bounds: [] satisfies Rect[],
      area: inferRect(selectedShapes[0]),
    }
  }

  if (selectedShapes.length > 1) {
    const rectsFromShape = selectedShapes.map(inferRect)
    const limitPoints = calculateLimitPoints({
      rects: rectsFromShape
    })

    return {
      bounds: rectsFromShape,
      area: {
        height: limitPoints.max.y - limitPoints.min.y,
        width: limitPoints.max.x - limitPoints.min.x,
        x: limitPoints.min.x,
        y: limitPoints.min.y,
      }
    }
  }

  return null
}