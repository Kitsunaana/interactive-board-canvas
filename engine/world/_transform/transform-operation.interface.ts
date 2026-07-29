import type { EventObject } from "../../behaviors/EventBehavior";
import type { Layer } from "../../Layer";
import type { SimObject } from "../sim-object";

export type TransformState = "idle" | "resize" | "rotate"
export type Corner = "topLeft" | "topRight" | "bottomLeft" | "bottomRight";
export type Edge = "top" | "right" | "bottom" | "left";

export interface TransformOperationModel {
  addHandlersToLayer(layer: Layer): void
  updateHandlersPosition(): void

  startTransform(event: EventObject): void
  processTransform(event: PointerEvent): void
  finishTransform(): void
}

export interface TransformStrategy extends SimObject {
  box: SimObject
  transformState: TransformState

  updateHandlersPosition(): void
}