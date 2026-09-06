import { EllipseShape } from "../shapes/Ellipse";
import type { CubicBezierPathV2, HandlerType } from "./cubic-bezier-path-v2";

export interface BaseCubicBezierHandle extends EllipseShape {
  anchorIndex: number

  changeToIdleStyle(): void
  changeToActiveStyle(): void
  changePosition(): void
}

export type BaseCubicBezierHandleParams = {
  context: CubicBezierPathContext,
  anchorIndex: number
  props: {
    radius: number
    x: number
    y: number
  }
}

export class CubicBezierAnchorHandle extends EllipseShape implements BaseCubicBezierHandle {
  public context: CubicBezierPathV2
  public anchorIndex: number

  public constructor({ props, context, anchorIndex }: BaseCubicBezierHandleParams) {
    super(props.x, props.y, props.radius, props.radius)

    this.anchorIndex = anchorIndex
    this.context = context
  }

  public changePosition(): void {
    const handler = this.context.getAnchorHandles(this.anchorIndex)

    const worldPointer = this.getLayerOrThrow().worldPointer
    const delta = worldPointer.sub(handler.anchor.startDragPointerPosition)

    handler.inHandle.position = this.context.dragStartPositions.inHandle.add(delta)
    handler.outHandle.position = this.context.dragStartPositions.outHandle.add(delta)
  }

  public changeToIdleStyle(): void {
    this.fillColor = "#a6e3a1"
    this.radius({ x: 5, y: 5 })
  }

  public changeToActiveStyle(): void {
    this.fillColor = "#f38ba8"
    this.radius({ x: 7, y: 7 })
  }
}

export class CubicBezierOutHandle extends EllipseShape implements BaseCubicBezierHandle {
  public context: CubicBezierPathV2
  public anchorIndex: number

  public constructor({ props, context, anchorIndex }: BaseCubicBezierHandleParams) {
    super(props.x, props.y, props.radius, props.radius)

    this.anchorIndex = anchorIndex
    this.context = context
  }

  public changePosition(): void {
    const handler = this.context.getAnchorHandles(this.anchorIndex)

    handler.inHandle.position = handler.anchor.position
      .scale(2)
      .sub(handler.outHandle.position)
  }

  public changeToIdleStyle(): void {
    this.fillColor = "#f9e2af"
    this.radius({ x: 4, y: 4 })
  }

  public changeToActiveStyle(): void {
    this.fillColor = "#fab387"
    this.radius({ x: 5, y: 5 })
  }
}

export class CubicBezierInHandle extends EllipseShape implements BaseCubicBezierHandle {
  public context: CubicBezierPathV2
  public anchorIndex: number

  public constructor({ props, context, anchorIndex }: BaseCubicBezierHandleParams) {
    super(props.x, props.y, props.radius, props.radius)

    this.anchorIndex = anchorIndex
    this.context = context
  }

  public changePosition(): void {
    const handler = this.context.getAnchorHandles(this.anchorIndex)

    handler.outHandle.position = handler.anchor.position
      .scale(2)
      .sub(handler.inHandle.position)
  }

  public changeToIdleStyle(): void {
    this.fillColor = "#f9e2af"
    this.radius({ x: 4, y: 4 })
  }

  public changeToActiveStyle(): void {
    this.fillColor = "#fab387"
    this.radius({ x: 5, y: 5 })
  }
}

export const ASSOCIATE_HANDLE_TYPE_WITH_SHAPE: Record<HandlerType, { new(params: BaseCubicBezierHandleParams): BaseCubicBezierHandle }> = {
  anchor: CubicBezierAnchorHandle,
  out: CubicBezierOutHandle,
  in: CubicBezierInHandle,
}