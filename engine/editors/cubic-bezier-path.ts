import { isUndefined } from "lodash"
import { Group } from "../Group"
import { Point, type PointData } from "../maths/Point"
import { CircleShape } from "../shapes/Circle"
import { PolygonShape } from "../shapes/Polygon"
import { SimObject } from "../world/sim-object"
import {
  BaseBezierHandle,
  BezierAnchorHandle,
  BezierInHandle,
  BezierOutHandle
} from "./cbp-manager"
import { CubicBezierSegment } from "./segment"


export type HandlerType = "anchor" | "inHandle" | "outHandle"

export type HandlerChild = {
  outHandle: BezierOutHandle,
  inHandle: BezierInHandle,
  anchor: BezierAnchorHandle,
}

export type ChildrenRecord = {
  segments: Array<PolygonShape>,
  handlers: Array<HandlerChild>
}

type DragStartPositionsByIndexRecord = Record<number, {
  anchor: Point
  inHandle: Point
  outHandle: Point
}>

export class CubicBezierPath extends Group {
  private static _convertHandlersToPoints(start: HandlerChild, end: HandlerChild): Array<Point> {
    return Object
      .values(start)
      .concat(Object.values(end))
      .map((handler) => handler.position)
  }

  public readonly toolType = "cubic" as const
  public readonly type = "CubicBezierPath" as const

  public activeControlIndex: number | null = null
  public isDrawingMode: boolean = false

  public childrenRecord: ChildrenRecord = {
    handlers: [],
    segments: [],
  }

  public dragStartPositionsByIndex: DragStartPositionsByIndexRecord = {}
  public isClosedPath: boolean = false

  public get anchorCount(): number {
    return this.childrenRecord.handlers.length
  }

  public get children(): Array<SimObject> {
    return [
      ...this.childrenRecord.segments,
      ...this.childrenRecord.handlers.flatMap((handler) => Object.values(handler)),
    ]
  }

  private _isShowHandleGuids: boolean = true

  public constructor() {
    super()

    window.hideSystemUiControls = this.hideSystemUiControls.bind(this)
  }

  public hideSystemUiControls() {
    this._isShowHandleGuids = false
    this.getFlatListHandlers().forEach((shape) => {
      shape.visible = false
    })
  }

  public fromShape(shape: PolygonShape): void {
    const points = shape.pointsToTrace
    const length = points.length;

    for (let i = 0; i < length; i += 3) {
      const anchor = points[i];
      const inHandle = points[i + 1];
      const outHandle = points[i + 2];

      const anchorIndex = i / 3

      this.buildAndPushHandler(anchorIndex, [anchor, inHandle, outHandle])

      const segmentPoints = points.slice(i, i + 6)
      if (segmentPoints.length === 6) {
        const segment = this.createSegment(segmentPoints)
        this.appendSegmentChild(segment)
      }
    }
  }

  public getFlatListHandlers(): Array<CircleShape> {
    return this.childrenRecord.handlers.flatMap(handler => Object.values(handler))
  }

  public getAnchorHandles(anchorIndex: number, treatAsClosed: boolean = true): HandlerChild {
    const index = treatAsClosed && this.isClosedPath && anchorIndex === this.anchorCount - 1
      ? 0
      : anchorIndex

    return this.childrenRecord.handlers[index]
  }

  public appendHandlesChild(...list: Array<HandlerChild>) {
    list.forEach((handles) => {
      this.childrenRecord.handlers.push(handles)

      Object
        .values(handles)
        .forEach((child) => {
          this.emitter.emit(this.routes.addChild({ child }))
          child.parent = this
        })
    })
  }

  public appendSegmentChild(...list: Array<CubicBezierSegment>) {
    list.forEach((segment) => {
      this.childrenRecord.segments.push(segment)
      this.emitter.emit(this.routes.addChild({ child: segment }))

      segment.parent = this
    })
  }

  public buildAndPushHandler(anchorIndex: number, points: [PointData, PointData, PointData]): HandlerChild {
    const handler: HandlerChild = {
      anchor: this.createControl(points[0], "anchor") as HandlerChild["anchor"],
      inHandle: this.createControl(points[1], "inHandle") as HandlerChild["inHandle"],
      outHandle: this.createControl(points[2], "outHandle") as HandlerChild["outHandle"],
    }

    this.appendHandlesChild(handler)

    return handler
  }

  public createSegment(points: Array<PointData>) {
    return new CubicBezierSegment({
      initialPoints: points,
      closed: false,
      cubic: true,

      strokeColor: "transparent",
      fillColor: "none",
      lineWidth: 2.5
    })
  }

  public adapterSegmentToHandles(anchorIndex: number) {
    const start = this.getAnchorHandles(anchorIndex)
    const end = this.getAnchorHandles(anchorIndex + 1)

    const P0 = start.anchor.position
    const P1 = start.outHandle.position
    const P2 = end.inHandle.position
    const P3 = end.anchor.position

    return [P0, P1, P2, P3] as const
  }

  public createControl(position: PointData, handleType: HandlerType): BaseBezierHandle {
    const shape = ({
      anchor: () => new BezierAnchorHandle({ ...position, radius: 5 }),
      inHandle: () => new BezierInHandle({ ...position, radius: 4 }),
      outHandle: () => new BezierOutHandle({ ...position, radius: 4 }),
    })[handleType]()

    shape.isListening = false

    return shape
  }

  public handleFinishDragControl(shape: BaseBezierHandle) {
    this._unionRestrictionControls(shape, shape.anchorIndex)
    this.recalculateSegmentsAfterMoving()
  }

  public captureInitialHandlePositions(anchorIndex: number): void {
    const { anchor, inHandle, outHandle } = this.getAnchorHandles(anchorIndex)

    this.dragStartPositionsByIndex[anchorIndex] = {
      anchor: anchor.position.clone(),
      inHandle: inHandle.position.clone(),
      outHandle: outHandle.position.clone(),
    }
  }

  public recalculateSegmentsAfterMoving(): void {
    const segments = this.childrenRecord.segments
    const handlers = this.childrenRecord.handlers

    segments.forEach((segment, index) => {
      const needRemapRestriction = this.isClosedPath && index === segments.length - 1

      const start = handlers[index]
      const end = handlers[needRemapRestriction ? 0 : index + 1]

      if (!isUndefined(start) && !isUndefined(end)) {
        segment.setPoints(CubicBezierPath._convertHandlersToPoints(start, end))
      }
    })
  }

  private _unionRestrictionControls(shape: CircleShape, anchorIndex: number): void {
    const isFirst = anchorIndex === 0
    const isLast = anchorIndex === this.anchorCount - 1
    const isRestrict = isFirst || isLast

    if (!isRestrict) return

    const target = this.getAnchorHandles(isLast ? 0 : this.anchorCount - 1)
    const distance = shape.position.sub(target.anchor.position).length()

    if (distance <= 7) {
      this.isClosedPath = true

      const lastControls = this.getAnchorHandles(this.anchorCount - 1, false)
      lastControls.anchor.position = target.anchor.position

      Object
        .values(lastControls)
        .forEach((control) => control.visible = false)
    }
  }

  /**
   * -------------------------------------------------------------------
   * RENDER
   * -------------------------------------------------------------------
   */
  public render(context: CanvasRenderingContext2D): void {
    super.render(context)

    if (this.childrenRecord.handlers.length === 0) return

    this._drawMainPath(context)

    if (this._shouldDrawPreviewSegment()) this._drawPreviewSegment(context)
    else if (this._shouldDrawInteractiveSegment()) this._drawInteractiveSegment(context)

    if (this._isShowHandleGuids) this._drawHandleGuides(context)
  }

  private _shouldDrawPreviewSegment(): boolean {
    return this.isDrawingMode && !this.activeControlIndex
  }

  private _shouldDrawInteractiveSegment(): boolean {
    return !!this.activeControlIndex && this.activeControlIndex > 0
  }

  private _applyActiveStrokeStyle(context: CanvasRenderingContext2D): void {
    context.strokeStyle = "red"
    context.lineWidth = 3
  }

  private _drawPreviewSegment(context: CanvasRenderingContext2D): void {
    const layer = this.layer

    const currentPointerPosition = layer.screenToWorld(layer.stage.absolutePositionCursor)
    const prevAnchorHandles = this.getAnchorHandles(this.anchorCount - 1, false)

    context.beginPath()
    context.moveTo(prevAnchorHandles.anchor.x, prevAnchorHandles.anchor.y)

    context.bezierCurveTo(
      ...prevAnchorHandles.outHandle.position.array(),
      ...currentPointerPosition.array(),
      ...currentPointerPosition.array(),
    )

    this._applyActiveStrokeStyle(context)
    context.stroke()
  }

  private _drawInteractiveSegment(context: CanvasRenderingContext2D): void {
    const prevHandles = this.getAnchorHandles(this.activeControlIndex! - 1)
    const currentHandles = this.getAnchorHandles(this.activeControlIndex!)

    context.beginPath()
    context.moveTo(prevHandles.anchor.x, prevHandles.anchor.y)

    context.bezierCurveTo(
      ...prevHandles.outHandle.position.array(),
      ...currentHandles.inHandle.position.array(),
      ...currentHandles.anchor.position.array()
    )

    this._applyActiveStrokeStyle(context)
    context.stroke()
  }

  private _drawHandleGuides(context: CanvasRenderingContext2D): void {
    context.setLineDash([3, 3])
    context.strokeStyle = "#4a4a5e"
    context.lineWidth = 1.2

    const totalAnchors = this.anchorCount

    for (let i = 0; i < totalAnchors; i++) {
      if (this.isClosedPath && i === totalAnchors - 1) continue

      const { anchor, inHandle, outHandle } = this.getAnchorHandles(i)

      context.beginPath()
      context.moveTo(anchor.x, anchor.y)
      context.lineTo(inHandle.x, inHandle.y)
      context.stroke()

      context.beginPath()
      context.moveTo(anchor.x, anchor.y)
      context.lineTo(outHandle.x, outHandle.y)
      context.stroke()
    }

    context.setLineDash([])
  }

  private _drawMainPath(context: CanvasRenderingContext2D): void {
    const firstHandles = this.getAnchorHandles(0)

    const totalAnchors = this.anchorCount

    context.save()
    context.beginPath()
    context.moveTo(firstHandles.anchor.x, firstHandles.anchor.y)

    for (let i = 1; i < totalAnchors; i++) {
      const prevHandles = this.getAnchorHandles(i - 1)
      const currentHandles = this.getAnchorHandles(i)

      context.bezierCurveTo(
        ...prevHandles.outHandle.position.array(),
        ...currentHandles.inHandle.position.array(),
        ...currentHandles.anchor.position.array(),
      )
    }

    context.strokeStyle = "#000"
    context.lineWidth = 2.5

    context.lineJoin = "round"
    context.lineCap = "round"
    context.stroke()

    if (this.isClosedPath) {
      context.fillStyle = "rgba(137,180,250,0.06)"
      context.fill()
    }

    context.restore()
  }
}
