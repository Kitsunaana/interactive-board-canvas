import type { Point, Rect } from "@/shared/type/shared";
import React from "react";
import type { ShapeToView } from "../../domain/shape";

export type IdleViewState = {
  selectedIds: Set<string>
  mouseDown?: Point
  type: "idle"
}

export type ShapesDraggingViewState = {
  selectedIds: Set<string>
  needToDeselect: boolean
  type: "shapesDragging"
}

export type ShapesResizeViewState = {
  selectedIds: Set<string>
  type: "shapesResize"
} 

export type ViewModelState =
  | IdleViewState
  | ShapesResizeViewState
  | ShapesDraggingViewState

export type ViewModelAction = {
  onClick?: (event: React.MouseEvent) => void
  isActive?: boolean
}

export type ViewModel = {
  nodes: ShapeToView[]
  selectionWindow?: Rect
  actions: {
    addSticker?: ViewModelAction
    addArrow?: ViewModelAction
  }
}

export const isIdle = (state: ViewModelState) => state.type === "idle"

export const isShapesResize = (state: ViewModelState) => state.type === "shapesResize"

export const isShapesDragging = (state: ViewModelState) => state.type === "shapesDragging"

export const goToIdle = (state: Partial<IdleViewState> = {}): IdleViewState => ({
  selectedIds: new Set(),
  mouseDown: undefined,
  type: "idle",
  ...state,
})

export const goToNodesDragging = (state: Partial<ShapesDraggingViewState> = {}): ShapesDraggingViewState => ({
  selectedIds: new Set(),
  needToDeselect: false,
  type: "shapesDragging",
  ...state,
})

export const goToShapesResize = (state: Partial<ShapesResizeViewState> = {}): ShapesResizeViewState => ({
  selectedIds: new Set(),
  type: "shapesResize",
  ...state,
})