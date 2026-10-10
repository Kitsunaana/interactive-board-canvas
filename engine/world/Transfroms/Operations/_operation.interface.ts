import {SimObject} from "../../../core/SimObject";

export type Corner = "topLeft" | "topRight" | "bottomLeft" | "bottomRight";
export type Edge = "top" | "right" | "bottom" | "left";

export type OperationHandler = Corner | Edge

export interface TransformContext {
  readonly target: SimObject
  readonly pickedHandler: OperationHandler

  readonly updateHandlePositions: () => void
}

export interface TransformOperation {
  start(context: TransformContext): void
  process(context: TransformContext): void
  finish(context: TransformContext): void
}