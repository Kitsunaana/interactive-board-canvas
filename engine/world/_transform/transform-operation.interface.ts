import type { EventObject } from "../../behaviors/EventBehavior_v2";
import type { Group } from "../../core/Group";
import type { Layer } from "../../core/Layer";
import type { Node } from "../../core/Node";

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

export interface TransformContext {
  transformState: TransformState
  context: Group & {
    box: Node
  }

  updateHandlersPosition(): void
}