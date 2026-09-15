import { isUndefined } from "lodash"
import { Group } from "../Group"
import { Point, type PointData } from "../maths/Point"
import { EllipseShape } from "../shapes/Ellipse"
import { PolygonShape } from "../shapes/Polygon"
import { SimObject } from "../world/sim-object"
import {
  ASSOCIATE_HANDLE_TYPE_WITH_SHAPE,
  CubicBezierAnchorHandle,
  CubicBezierInHandle,
  CubicBezierOutHandle,
  type BaseCubicBezierHandle
} from "./cbp-manager"

export type HandlerType = "anchor" | "in" | "out"

export type HandlerChild = {
  outHandle: CubicBezierOutHandle,
  inHandle: CubicBezierInHandle,
  anchor: CubicBezierAnchorHandle,
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
        this.buildAndPushSegment(anchorIndex, segmentPoints)
      }
    }
  }

  public getFlatListHandlers(): Array<EllipseShape> {
    return this.childrenRecord.handlers.flatMap(handler => Object.values(handler))
  }

  public getAnchorHandles(anchorIndex: number, treatAsClosed: boolean = true): HandlerChild {
    const index = treatAsClosed && this.isClosedPath && anchorIndex === this.anchorCount - 1
      ? 0
      : anchorIndex

    return this.childrenRecord.handlers[index]
  }

  public buildAndPushHandler(anchorIndex: number, points: [PointData, PointData, PointData]): HandlerChild {
    const handler: HandlerChild = {
      anchor: this._createSingleControlHandle(points[0], anchorIndex, "anchor") as HandlerChild["anchor"],
      inHandle: this._createSingleControlHandle(points[1], anchorIndex, "in") as HandlerChild["inHandle"],
      outHandle: this._createSingleControlHandle(points[2], anchorIndex, "out") as HandlerChild["outHandle"],
    }

    this.childrenRecord.handlers.push(handler)

    handler.outHandle.parent = this
    handler.inHandle.parent = this
    handler.anchor.parent = this

    return handler
  }

  private _dragSegmentT: number = 0

  public buildAndPushSegment(anchorIndex: number, points: Array<PointData>): void {
    const segment = new PolygonShape({
      initialPoints: points,
      closed: false,
      cubic: true,
    })

    segment.lineWidth = 2.5
    segment.fillColor = "none"
    segment.strokeColor = "transparent"

    segment.on("pointerover", () => {
      segment.strokeColor = "#3b6ae830"
      segment.lineWidth = 14
    })

    segment.on("pointerleave", () => {
      segment.strokeColor = "transparent"
      segment.lineWidth = 2.5
    })

    segment.dragBehavior.subscribe()

    const drag = segment.dragBehavior
    const start = this.getAnchorHandles(anchorIndex)
    const end = this.getAnchorHandles(anchorIndex + 1)

    segment.emitter.on(drag.routes.finishDrag, this._recalculateSegmentsAfterMoving.bind(this))

    segment.emitter.on(drag.routes.startDrag, () => {
      this._captureInitialHandlePositions(anchorIndex)
      this._captureInitialHandlePositions(anchorIndex + 1)

      this._dragSegmentT = this._findClosestT(anchorIndex, drag.startPosition)
    })

    segment.emitter.on(drag.routes.processDrag, () => {
      const delta = drag.delta.add(drag.deltaBetweenStartAndObjectPositions)

      const t = this._dragSegmentT
      const u = 1 - t

      const wLeft = u
      const wRight = t

      const denom = 3 * t * u * (u * u + t * t)
      const maxScale = 50
      const scaleFactor = denom > 0.0001 ? Math.min(1 / denom, maxScale) : maxScale
      const S = delta.scale(scaleFactor)

      const dLeft = S.scale(wLeft)
      const dRight = S.scale(wRight)

      const first = this.dragStartPositionsByIndex[anchorIndex]
      const second = this.dragStartPositionsByIndex[anchorIndex + 1]

      start.outHandle.position = first.outHandle.add(dLeft)
      start.inHandle.position = first.inHandle.sub(dLeft)

      end.inHandle.position = second.inHandle.add(dRight)
      end.outHandle.position = second.outHandle.sub(dRight)

      segment.strokeColor = "#3b6ae830"
      segment.lineWidth = 14

      this._recalculateSegmentsAfterMoving()
    })

    this.childrenRecord.segments.push(segment)
    segment.parent = this
  }

  private _createSingleControlHandle(position: PointData, anchorIndex: number, handleType: HandlerType): BaseCubicBezierHandle {
    const handleShape = new ASSOCIATE_HANDLE_TYPE_WITH_SHAPE[handleType]({
      props: position,
      context: this,
      anchorIndex,
    })

    handleShape.isListening = false
    handleShape.dragBehavior.subscribe()

    handleShape.on("pointerover", () => document.body.style.cursor = "move")
    handleShape.on("pointerout", () => document.body.style.cursor = "auto")

    handleShape.emitter.on(handleShape.dragBehavior.routes.startDrag, () => {
      this._captureInitialHandlePositions(handleShape.anchorIndex)
      handleShape.changeToActiveStyle()
    })

    handleShape.emitter.on(handleShape.dragBehavior.routes.finishDrag, () => {
      this._unionRestrictionControls(handleShape, handleShape.anchorIndex)
      this._recalculateSegmentsAfterMoving()
      handleShape.changeToIdleStyle()
    })

    handleShape.emitter.on(handleShape.dragBehavior.routes.processDrag, () => {
      handleShape.changePosition()
    })

    return handleShape
  }

  private _captureInitialHandlePositions(anchorIndex: number): void {
    const { anchor, inHandle, outHandle } = this.getAnchorHandles(anchorIndex)

    this.dragStartPositionsByIndex[anchorIndex] = {
      anchor: anchor.position.clone(),
      inHandle: inHandle.position.clone(),
      outHandle: outHandle.position.clone(),
    }
  }

  private _recalculateSegmentsAfterMoving(): void {
    const { segments, handlers } = this.childrenRecord

    segments.forEach((segment, index) => {
      const needRemapRestriction = this.isClosedPath && index === segments.length - 1

      const start = handlers[index]
      const end = handlers[needRemapRestriction ? 0 : index + 1]

      if (!isUndefined(start) && !isUndefined(end)) {
        segment.setPoints(CubicBezierPath._convertHandlersToPoints(start, end))
      }
    })
  }

  private _unionRestrictionControls(shape: EllipseShape, anchorIndex: number): void {
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

  private _findClosestT(anchorIndex: number, clickPos: Point): number {
    const a = this.getAnchorHandles(anchorIndex)
    const b = this.getAnchorHandles(anchorIndex + 1)

    const P0 = a.anchor.position
    const P1 = a.outHandle.position
    const P2 = b.inHandle.position
    const P3 = b.anchor.position

    const evalBezier = (t: number): Point => {
      const u = 1 - t
      return P0.scale(u * u * u)
        .add(P1.scale(3 * u * u * t))
        .add(P2.scale(3 * u * t * t))
        .add(P3.scale(t * t * t))
    }

    let bestT = 0.5
    let bestDist = Infinity
    const samples = 100

    for (let i = 0; i <= samples; i++) {
      const t = i / samples
      const dist = evalBezier(t).sub(clickPos).lengthSquared()
      if (dist < bestDist) {
        bestDist = dist
        bestT = t
      }
    }

    let lo = Math.max(0, bestT - 1 / samples)
    let hi = Math.min(1, bestT + 1 / samples)

    for (let i = 0; i < 12; i++) {
      const mid = (lo + hi) / 2
      const distLo = evalBezier(lo).sub(clickPos).lengthSquared()
      const distMid = evalBezier(mid).sub(clickPos).lengthSquared()
      const distHi = evalBezier(hi).sub(clickPos).lengthSquared()

      if (distLo <= distMid && distLo <= distHi) {
        hi = mid
      } else if (distHi <= distMid && distHi <= distLo) {
        lo = mid
      } else {
        lo = (lo + mid) / 2
        hi = (mid + hi) / 2
      }
    }

    return (lo + hi) / 2
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

    this._drawHandleGuides(context)
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
