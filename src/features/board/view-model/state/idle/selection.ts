import { addPoint, getPointFromEvent, screenToCanvas, subtractPoint } from "@/shared/lib/point.ts";
import { _u } from "@/shared/lib/utils.ts";
import type { Point } from "@/shared/type/shared.ts";
import { generateRectSketchProps, type Sticker, type StickerToView } from "../../../domain/sticker.ts";
import type { Camera } from "../../../modules/_camera";
import type { IdleViewState } from "../type.ts";
import { match } from "@/shared/lib/match.ts";
import { left, right } from "@/shared/lib/either.ts";
import { computeLimitPoints } from "@/features/board/modules/_mini-map/_core.ts";

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

export const moveSelectedStickers = ({ camera, stickers, point, event, selectedIds }: {
  selectedIds: Set<string>
  event: PointerEvent
  stickers: Sticker[]
  camera: Camera
  point: Point
}) => {
  const distance = subtractPoint(point, screenToCanvas({
    point: getPointFromEvent(event),
    camera,
  }))

  return stickers.map((node) => {
    if (selectedIds.has(node.id)) {
      const endPoint = addPoint(node, distance)

      return match(
        node,
        {
          default: (sticker) => _u.merge(sticker, endPoint),
          sketch: (sticker) => _u.merge(_u.merge(sticker, endPoint), generateRectSketchProps(
            _u.merge(endPoint, {
              height: sticker.height,
              width: sticker.width,
              id: sticker.id,
            })
          ))
        },
        "variant"
      )
    }

    return node
  })
}

export const stickerSelection = ({ event, node, idleState }: {
  idleState: IdleViewState
  event: PointerEvent
  node: StickerToView
}): IdleViewState => {
  if (idleState.selectedIds.has(node.id) && !event.ctrlKey) return idleState

  return {
    ...idleState,
    selectedIds: selectItems({
      modif: event.ctrlKey ? "toggle" : "replace",
      initialSelected: idleState.selectedIds,
      ids: [node.id],
    })
  }
}

export const getRectBySelectedNodes = ({ nodes, selectedIds }: {
  selectedIds: Set<string>
  nodes: Sticker[]
}) => {
  if (selectedIds.size === 1) {
    const rect = nodes.find(node => selectedIds.has(node.id))
    if (rect === undefined) return left(null)

    return right({
      height: rect.height,
      width: rect.width,
      x: rect.x,
      y: rect.y,
    })
  }

  if (selectedIds.size > 1) {
    const rects = nodes.filter(node => selectedIds.has(node.id))

    const limitPoints = computeLimitPoints({
      maxSizes: { height: 0, width: 0 },
      rects,
    })

    return right({
      height: limitPoints.max.y - limitPoints.min.y,
      width: limitPoints.max.x - limitPoints.min.x,
      // height: limitPoints.max.y,
      // width: limitPoints.max.x,
      x: limitPoints.min.x,
      y: limitPoints.min.y,
    })
  }

  return left(null)
}