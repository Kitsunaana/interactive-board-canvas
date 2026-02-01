import type { ClientShape } from "@/entities/shape/model/types"
import type { Point, Rect } from "@/shared/type/shared"
import type { ShapesRotateViewState } from "../../view-model/state/_view-model.type"
import type { Selection } from "../../domain/selection"

export type RotateableShapesStrategyParams = {
  shapes: ClientShape[]
  startCursor: Point
  area: Rect
}

export type RotateableShapesStrategyRotateParams = {
  state: ShapesRotateViewState
  currentCursor: Point
}

export type RotateableShapesStrategy = (params: RotateableShapesStrategyParams) => {
  finish: () => void

  goToRotate: (selectedIds: Selection) => ShapesRotateViewState

  rotate: (params: RotateableShapesStrategyRotateParams) => {
    nextState: (state: ShapesRotateViewState) => ShapesRotateViewState
    nextShapes: () => ClientShape[]
  }
}