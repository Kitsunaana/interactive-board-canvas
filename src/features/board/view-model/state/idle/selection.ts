import type { Shape } from "@/features/board/domain/dto.ts";
import { calculateLimitPoints } from "@/features/board/modules/_mini-map/_core.ts";
import { left, right } from "@/shared/lib/either.ts";
import { inferRect } from "@/shared/lib/rect.ts";
import type { Rect } from "@/shared/type/shared.ts";
import type { IdleViewState } from "../type.ts";

export type SelectionModifier = "replace" | "add" | "toggle"
export type Selection = Set<string>

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

export const getRectBySelectedShapes = ({ shapes, selectedIds }: {
  selectedIds: Set<string>
  shapes: Shape[]
}) => {
  if (selectedIds.size === 1) {
    const selected = shapes.find((node) => selectedIds.has(node.id))

    if (selected === undefined) return left(null)

    return right({
      rects: [] satisfies Rect[],
      main: inferRect(selected)
    })
  }

  if (selectedIds.size > 1) {
    const selecteds = shapes.filter((node) => selectedIds.has(node.id)).map(inferRect)

    const limitPoints = calculateLimitPoints({ rects: selecteds })

    return right({
      rects: selecteds,
      main: {
        height: limitPoints.max.y - limitPoints.min.y,
        width: limitPoints.max.x - limitPoints.min.x,
        x: limitPoints.min.x,
        y: limitPoints.min.y,
      }
    })
  }

  return left(null)
}