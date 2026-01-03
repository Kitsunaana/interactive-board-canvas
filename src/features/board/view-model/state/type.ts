import type { Point, Rect } from "@/shared/type/shared";
import React from "react";
import type { StickerToView } from "../../domain/sticker";

export type IdleViewState = {
  selectedIds: Set<string>
  mouseDown?: Point
  type: "idle"
}

export type ViewModelState =
  | IdleViewState

export type ViewModelAction = {
  onClick?: (event: React.MouseEvent) => void
  isActive?: boolean
}

export type ViewModel = {
  nodes: StickerToView[]
  selectionWindow?: Rect
  actions: {
    addSticker?: ViewModelAction
    addArrow?: ViewModelAction
  }
}

export const goToIdle = (state: Partial<IdleViewState> = {}): IdleViewState => ({
  selectedIds: new Set(),
  mouseDown: undefined,
  type: "idle",
  ...state,
})

