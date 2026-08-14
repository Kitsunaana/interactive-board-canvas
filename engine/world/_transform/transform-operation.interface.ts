import type { EventObject } from "../../behaviors/EventBehavior";
import { Group } from "../../Group";
import type { LayerV2 } from "../../LayerV2";
import type { SimObject } from "../sim-object";

export type TransformState = "idle" | "resize" | "rotate"
export type Corner = "topLeft" | "topRight" | "bottomLeft" | "bottomRight";
export type Edge = "top" | "right" | "bottom" | "left";

export interface TransformOperationModel {
  addHandlersToLayer(layer: LayerV2): void
  updateHandlersPosition(): void

  startTransform(event: EventObject): void
  processTransform(event: PointerEvent): void
  finishTransform(): void
}

export interface TransformContext {
  transformState: TransformState
  context: Group & {
    box: SimObject
  }

  updateHandlersPosition(): void
}