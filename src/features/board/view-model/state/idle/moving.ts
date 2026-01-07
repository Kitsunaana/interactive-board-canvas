import { match } from "@/shared/lib/match.ts";
import type { Point } from "@/shared/type/shared.ts";
import type { Sticker } from "../../../domain/sticker.ts";
import type { Camera } from "../../../modules/_camera";
import { viewModelState$ } from "../index.ts";
import { goToIdle, type ViewModelState } from "../type.ts";
import { moveSelectedStickers } from "./selection.ts";

type StartStickerMove = (params: { event: PointerEvent; sticker: Sticker; point: Point }) => ViewModelState

type MovingSticker = (params: { event: PointerEvent; stickers: Sticker[]; camera: Camera; point: Point }) => Sticker[]

export const startMoveSticker: StartStickerMove = ({ event, point, sticker }) => (
  match(viewModelState$.getValue(), {
    idle: (state) => state,
    nodesDragging: (state) => {
      const hasPressedKey = event.ctrlKey || event.shiftKey

      if (state.selectedIds.has(sticker.id) || hasPressedKey) return state

      return {
        ...state,
        mouseDown: point,
        selectedIds: new Set(sticker.id),
      }
    }
  })
)

export const movingSticker: MovingSticker = ({ stickers, camera, point, event }) => (
  match(viewModelState$.getValue(), {
    idle: () => stickers,
    nodesDragging: ({ selectedIds }) => (
      moveSelectedStickers({
        selectedIds,
        stickers,
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
