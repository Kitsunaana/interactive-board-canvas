import { match } from "@/shared/lib/match.ts";
import type { Point } from "@/shared/type/shared.ts";
import { isNil } from "lodash";
import type { Sticker } from "../../../domain/sticker.ts";
import type { Camera } from "../../../modules/_camera";
import { viewModelState$ } from "../index.ts";
import { moveSelectedStickers } from "./selection.ts";
import type { IdleViewState } from "../type.ts";

type StartStickerMove = (params: { event: PointerEvent; sticker: Sticker; point: Point }) => IdleViewState

type MovingSticker = (params: { event: PointerEvent; stickers: Sticker[]; camera: Camera; point: Point }) => Sticker[]

export const startStickerMove: StartStickerMove = ({ event, point, sticker }) => (
  match(viewModelState$.getValue(), {
    __other: (state) => state,
    idle: (idleState) => {
      const hasPressedKey = event.ctrlKey || event.shiftKey

      if (idleState.selectedIds.has(sticker.id) || hasPressedKey) return idleState

      return {
        ...idleState,
        mouseDown: point,
        selectedIds: new Set(sticker.id),
      }
    }
  })
)

export const movingSticker: MovingSticker = ({ stickers, camera, point, event }) => (
  match(viewModelState$.getValue(), {
    __other: () => stickers,
    idle: ({ selectedIds }) => (
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
    __other: (state) => state,
    idle: (idleState) => {
      if (isNil(idleState.mouseDown)) return idleState

      return {
        ...idleState,
        mouseDown: undefined,
        selectedIds: new Set<string>()
      }
    }
  })
)
