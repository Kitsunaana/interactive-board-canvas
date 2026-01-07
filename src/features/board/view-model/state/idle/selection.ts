import { calculateLimitPoints } from "@/features/board/modules/_mini-map/_core.ts";
import { left, right } from "@/shared/lib/either.ts";
import { match } from "@/shared/lib/match.ts";
import { addPoint, getPointFromEvent, screenToCanvas, subtractPoint } from "@/shared/lib/point.ts";
import { _u } from "@/shared/lib/utils.ts";
import type { Point, Rect } from "@/shared/type/shared.ts";
import { generateRectSketchProps, type Sticker } from "../../../domain/sticker.ts";
import type { Camera } from "../../../modules/_camera";
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

export const stickerSelection = ({ event, stickerId, idleState }: {
  idleState: IdleViewState
  event: PointerEvent
  stickerId: string
}): IdleViewState => {
  if (idleState.selectedIds.has(stickerId) && !event.ctrlKey) return idleState

  return {
    ...idleState,
    selectedIds: selectItems({
      modif: event.ctrlKey ? "toggle" : "replace",
      initialSelected: idleState.selectedIds,
      ids: [stickerId],
    })
  }
}

export const getRectBySelectedNodes = ({ stickers, selectedIds }: {
  selectedIds: Set<string>
  stickers: Sticker[]
}) => {
  if (selectedIds.size === 1) {
    const rect = stickers.find(node => selectedIds.has(node.id))
    if (rect === undefined) return left(null)

    return right({
      rects: [] satisfies Rect[],
      main: {
        height: rect.height,
        width: rect.width,
        x: rect.x,
        y: rect.y,
      }
    })
  }

  if (selectedIds.size > 1) {
    const rects = stickers.filter((node) => selectedIds.has(node.id)).map((rect): Rect => ({
      height: rect.height,
      width: rect.width,
      x: rect.x,
      y: rect.y
    }))

    const limitPoints = calculateLimitPoints({ rects })

    return right({
      rects,
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