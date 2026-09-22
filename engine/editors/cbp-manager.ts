import { createRoute } from "../EventBus";
import { CircleShape, type CircleShapeConfig } from "../shapes/Circle";
import type { CubicBezierPath, HandlerChild } from "./cubic-bezier-path";

export type BezierHandleConfig = CircleShapeConfig

export type TangentMode = "symmetric" | "smooth" | "independent"

export abstract class BaseBezierHandle extends CircleShape {
  public abstract readonly handleType: string

  public abstract idleColor: string
  public abstract idleRadius: number
  public abstract activeColor: string
  public abstract activeRadius: number

  public abstract updatePosition(): void

  public tangentMode: TangentMode = "independent"

  public get parentPath() {
    return this._getFirstParentByType<CubicBezierPath>({ type: "CubicBezierPath" })
  }

  public get anchorIndex() {
    return this.parentPath.childrenRecord.handlers.findIndex((handler) => (
      Object
        .values(handler)
        .includes(this as any)
    ))
  }

  public constructor({ x, y, radius }: BezierHandleConfig) {
    super(x, y, radius)

    this.dragBehavior.subscribe()

    this.on("pointerover", this.setActiveAppearance.bind(this))
    this.on("pointerout", this.setIdleAppearance.bind(this))

    this.emitter.on(this.routes.processDrag, this.updatePosition.bind(this))

    this.emitter.on(this.routes.finishDrag, () => {
      this.parentPath.handleFinishDragControl(this)
      this.setIdleAppearance()
    })

    this.emitter.on(this.routes.startDrag, () => {
      this.parentPath.captureInitialHandlePositions(this.anchorIndex)
      this.setActiveAppearance()
    })
  }

  public setIdleAppearance(): void {
    document.body.style.cursor = "auto"
    this.fillColor = this.idleColor
    this.radius(this.idleRadius)
  }

  public setActiveAppearance(): void {
    document.body.style.cursor = "move"
    this.fillColor = this.activeColor
    this.radius(this.activeRadius)
  }
}

export abstract class BaseBezierTangentHandle<K1 extends keyof HandlerChild, K2 extends Exclude<keyof HandlerChild, K1>> extends BaseBezierHandle {
  public abstract readonly oppositeKey: K2
  public abstract readonly ownKey: K1

  private _independentOppositeHandle(_handles: HandlerChild) {
    return
  }

  private _mirrorOppositeHandle(handles: HandlerChild): void {
    handles[this.oppositeKey].position = handles.anchor.position
      .scale(2)
      .sub(handles[this.ownKey].position)
  }

  private _rotateOppositeHandle(handles: HandlerChild): void {
    const draggedPos = this.dragBehavior.nextPosition

    const opposite = handles[this.oppositeKey].position
    const anchor = handles.anchor.position

    const oppositeLength = opposite.sub(anchor).length()
    const delta = draggedPos.sub(anchor)
    const draggedLength = delta.length()

    if (draggedLength > 0) {
      const nextOppositePos = anchor.sub(delta.div(draggedLength).scale(oppositeLength))
      handles[this.oppositeKey].position = nextOppositePos
    }
  }

  public updatePosition(): void {
    const handler = this.parentPath.getAnchorHandles(this.anchorIndex)
    handler[this.ownKey].position = this.dragBehavior.nextPosition

      ; ({
        independent: this._independentOppositeHandle.bind(this),
        symmetric: this._mirrorOppositeHandle.bind(this),
        smooth: this._rotateOppositeHandle.bind(this),
      })[this.tangentMode](handler)
  }
}

export class BezierAnchorHandle extends BaseBezierHandle {
  public readonly handleType = "anchor" as const

  public idleColor: string = "#a6e3a1"
  public activeColor: string = "#f38ba8"
  public activeRadius: number = 7
  public idleRadius: number = 5

  public canExtendPath: boolean = true
  public extendPathRoute = createRoute("extendPath").withParams<CubicBezierPath>()

  public constructor(params: BezierHandleConfig) {
    super(params)
    this.fillColor = this.idleColor

    this.emitter.on(this.routes.finishDrag, this._resetExtendFlag.bind(this))
    this.on("click", this._tryExtendPath.bind(this))
  }

  private _resetExtendFlag() {
    this.canExtendPath = this.dragBehavior.delta.isZero()
  }

  private _tryExtendPath() {
    if (this.canExtendPath) {
      const allHandles = this.parentPath.childrenRecord.handlers
      const isLastAnchor = this.anchorIndex === allHandles.length - 1

      if (isLastAnchor) this.emitter.emit(this.extendPathRoute(this.parentPath))
    }
  }

  public updatePosition(): void {
    const handles = this.parentPath.getAnchorHandles(this.anchorIndex)
    const index = handles.anchor.anchorIndex
    const drag = this.dragBehavior

    const totalDelta = drag.delta.add(drag.deltaBetweenStartAndObjectPositions)
    const origins = this.parentPath.dragStartPositionsByIndex[index]

    handles.anchor.position = this.dragBehavior.currentPosition

    handles.inHandle.position = origins.inHandle.add(totalDelta)
    handles.outHandle.position = origins.outHandle.add(totalDelta)
  }
}

export class BezierInHandle extends BaseBezierTangentHandle<"inHandle", "outHandle"> {
  public idleColor: string = "#f9e2af"
  public activeColor: string = "#fab387"
  public activeRadius: number = 5
  public idleRadius: number = 4

  public handleType = "inHandle"
  public ownKey = "inHandle" as const
  public oppositeKey = "outHandle" as const

  public constructor(params: BezierHandleConfig) {
    super(params)
    this.fillColor = this.idleColor
  }
}

export class BezierOutHandle extends BaseBezierTangentHandle<"outHandle", "inHandle"> {
  public idleColor: string = "#f9e2af"
  public activeColor: string = "#fab387"
  public activeRadius: number = 5
  public idleRadius: number = 4

  public handleType = "outHandle"
  public ownKey = "outHandle" as const
  public oppositeKey = "inHandle" as const

  public constructor(params: BezierHandleConfig) {
    super(params)
    this.fillColor = this.idleColor
  }
}

export const ASSOCIATE_HANDLE_TYPE_WITH_SHAPE = {
  anchor: BezierAnchorHandle,
  inHandle: BezierInHandle,
  outHandle: BezierOutHandle,
} as const
