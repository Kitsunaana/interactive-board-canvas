import type { EventObject } from "../behaviors/EventBehavior";
import { EllipseShape } from "../shapes/Ellipse";
import type { CubicBezierPath, HandlerType } from "./cubic-bezier-path";

export interface BaseCubicBezierHandle extends EllipseShape {
  handleType: string

  anchorIndex: number
  initialColor: string
  defaultRadius: number

  changeToIdleStyle(): void
  changeToActiveStyle(): void
  changePosition(): void
}

export type BaseCubicBezierHandleParams = {
  context: CubicBezierPath,
  anchorIndex: number
  props: {
    x: number
    y: number
  }
}

export class CubicBezierAnchorHandle extends EllipseShape implements BaseCubicBezierHandle {
  public readonly handleType = "anchor" as const

  public context: CubicBezierPath
  public anchorIndex: number

  public initialColor: string = "#a6e3a1"
  public defaultRadius: number = 5

  public canStartExtendPath: boolean = true
  public extendPathFromLastAnchorCallback = (event: EventObject, pathId: string) => { }

  public constructor({ props, context, anchorIndex }: BaseCubicBezierHandleParams) {
    super(props.x, props.y, 5, 5)

    this.radius({ x: this.defaultRadius, y: this.defaultRadius })
    this.fillColor = this.initialColor

    this.anchorIndex = anchorIndex
    this.context = context

    this.emitter.on(this.dragBehavior.routes.finishDrag, () => {
      const delta = this.dragBehavior.delta
      this.canStartExtendPath = delta.x === 0 && delta.y === 0
    })

    this.on("click", (event) => {
      const pathId = this.parent?.id
      if (pathId && this.canStartExtendPath) {
        this.extendPathFromLastAnchorCallback(event, pathId)
      }
    })
  }

  public changePosition(): void {
    const handler = this.context.getAnchorHandles(this.anchorIndex)
    const index = handler.anchor.anchorIndex

    const delta = this.dragBehavior.delta.add(this.dragBehavior.deltaBetweenStartAndObjectPositions)

    handler.anchor.position = this.dragBehavior.currentPosition
    handler.inHandle.position = this.context.dragStartPositionsByIndex[index].inHandle.add(delta)
    handler.outHandle.position = this.context.dragStartPositionsByIndex[index].outHandle.add(delta)
  }

  public changeToIdleStyle(): void {
    this.radius({ x: this.defaultRadius, y: this.defaultRadius })
    this.fillColor = this.initialColor
  }

  public changeToActiveStyle(): void {
    this.radius({ x: 7, y: 7 })
    this.fillColor = "#f38ba8"
  }
}

export class CubicBezierOutHandle extends EllipseShape implements BaseCubicBezierHandle {
  public readonly handleType = "out" as const

  public context: CubicBezierPath
  public anchorIndex: number

  public initialColor: string = "#f9e2af"
  public defaultRadius: number = 4

  public constructor({ props, context, anchorIndex }: BaseCubicBezierHandleParams) {
    super(props.x, props.y, 4, 4)

    this.anchorIndex = anchorIndex
    this.context = context
  }

  public changePosition(): void {
    const handler = this.context.getAnchorHandles(this.anchorIndex)

    handler.outHandle.position = this.dragBehavior.nextPosition
    handler.inHandle.position = handler.anchor.position
      .scale(2)
      .sub(handler.outHandle.position)
  }

  public changeToIdleStyle(): void {
    this.radius({ x: this.defaultRadius, y: this.defaultRadius })
    this.fillColor = this.initialColor
  }

  public changeToActiveStyle(): void {
    this.fillColor = "#fab387"
    this.radius({ x: 5, y: 5 })
  }
}

export class CubicBezierInHandle extends EllipseShape implements BaseCubicBezierHandle {
  public readonly handleType = "in" as const

  public context: CubicBezierPath
  public anchorIndex: number

  public initialColor: string = "#f9e2af"
  public defaultRadius: number = 4

  public constructor({ props, context, anchorIndex }: BaseCubicBezierHandleParams) {
    super(props.x, props.y, 4, 4)

    this.anchorIndex = anchorIndex
    this.context = context
  }

  public changePosition(): void {
    const handler = this.context.getAnchorHandles(this.anchorIndex)

    handler.inHandle.position = this.dragBehavior.nextPosition
    handler.outHandle.position = handler.anchor.position
      .scale(2)
      .sub(handler.inHandle.position)
  }

  public changeToIdleStyle(): void {
    this.radius({ x: this.defaultRadius, y: this.defaultRadius })
    this.fillColor = this.initialColor
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