import { isEmpty } from "lodash"
import { Group } from "../Group"
import { LayerV2 } from "../LayerV2"
import { Point, type PointData } from "../maths/Point"
import { EllipseShape } from "../shapes/Ellipse"
import { PolygonShape } from "../shapes/Polygon"
import { SimObject } from "../world/sim-object"

type HandlerType = "anchor" | "in" | "out"

type HandlerChild = {
  anchor: EllipseShape,
  inHandle: EllipseShape,
  outHandle: EllipseShape
}

type ChildrenRecord = {
  segments: Array<PolygonShape>,
  handlers: Array<HandlerChild>
}

const HANDLE_CONFIGURATIONS = [
  {
    defaultRadius: 5,
    handleType: "anchor",
    initialColor: "#a6e3a1",
  },

  {
    defaultRadius: 4,
    handleType: "in",
    initialColor: "#f9e2af",
  },

  {
    defaultRadius: 4,
    handleType: "out",
    initialColor: "#f9e2af",
  }
] as const

export class CubicBezierPathV2 extends Group {
  private static _convertHandlersToPoints(start: HandlerChild, end: HandlerChild): Array<Point> {
    return Object
      .values(start)
      .concat(Object.values(end))
      .map((handler) => handler.position)
  }

  public readonly toolType = "cubic" as const

  private _activeControlIndex: number | null = null
  private _isDrawingMode: boolean = false
  private _isClosedPath: boolean = false

  public childrenRecord: ChildrenRecord = {
    handlers: [],
    segments: [],
  }

  private _dragStartPositions = {
    anchor: Point.zero(),
    inHandle: Point.zero(),
    outHandle: Point.zero(),
  } as const

  public get anchorCount(): number {
    return this.childrenRecord.handlers.length
  }

  public children(): Array<SimObject>
  public children(...list: Array<SimObject>): void
  public children(...list: Array<SimObject>): Array<SimObject> | void {
    if (isEmpty(list)) {
      return [
        ...this.childrenRecord.segments,
        ...this.childrenRecord.handlers.flatMap((handler) => Object.values(handler)),
      ]
    }

    return
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
      if (segmentPoints.length === 6) this.buildAndPushSegment(segmentPoints)
    }
  }

  public getFlatListHandlers(): Array<EllipseShape> {
    return this.childrenRecord.handlers.flatMap(handler => Object.values(handler))
  }

  public getAnchorHandles(anchorIndex: number, treatAsClosed: boolean = true): HandlerChild {
    const index = treatAsClosed && this._isClosedPath && anchorIndex === this.anchorCount - 1
      ? 0
      : anchorIndex

    return this.childrenRecord.handlers[index]
  }

  public buildAndPushHandler(anchorIndex: number, points: [PointData, PointData, PointData], isListening = true): void {
    const layer = this.getLayerOrThrow();
    const r = ["anchor", "inHandle", "outHandle"] as Array<keyof HandlerChild>

    const handler = r.reduce((acc, current, index) => {
      const node = this._createSingleControlHandle(layer, points[index], anchorIndex, index)
      node.isListening = isListening

      acc[current] = node
      return acc
    }, {} as HandlerChild)

    this.childrenRecord.handlers.push(handler)
  }

  public buildAndPushSegment(points: Array<PointData>): void {
    const layer = this.getLayerOrThrow()
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

    segment.layer(layer)

    this.childrenRecord.segments.push(segment)
  }

  private _createSingleControlHandle(layer: LayerV2, position: PointData, anchorIndex: number, confingIdx: number): EllipseShape {
    const { handleType, initialColor, defaultRadius } = HANDLE_CONFIGURATIONS[confingIdx]

    const handleShape = new EllipseShape(position.x, position.y, defaultRadius, defaultRadius)

    handleShape.isListening = false
    handleShape.fillColor = initialColor

    handleShape.layer(layer)
    handleShape.subscribe(handleShape)
    handleShape.addClassname("handle-shape")

    handleShape.on("pointerover", () => document.body.style.cursor = "move")
    handleShape.on("pointerout", () => document.body.style.cursor = "auto")

    handleShape.on("startDrag", () => this._handleStartDragControl(handleType, handleShape, anchorIndex))
    handleShape.on("finishDrag", () => this._handleFinishDragControl(handleType, handleShape, anchorIndex))
    handleShape.on("processDrag", () => this._handleDragMoveControl(handleType, anchorIndex))

    return handleShape
  }

  private _captureInitialHandlePositions(anchorIndex: number): void {
    const { anchor, inHandle, outHandle } = this.getAnchorHandles(anchorIndex)

    anchor.position.copyTo(this._dragStartPositions.anchor)
    inHandle.position.copyTo(this._dragStartPositions.inHandle)
    outHandle.position.copyTo(this._dragStartPositions.outHandle)
  }

  private _recalculateSegmentsAfterMoving(): void {
    const { segments, handlers } = this.childrenRecord

    segments.forEach((segment, index) => {
      const needRemapRestriction = this._isClosedPath && index === segments.length - 1

      const start = handlers[index]
      const end = handlers[needRemapRestriction ? 0 : index + 1]

      segment.setPoints(CubicBezierPathV2._convertHandlersToPoints(start, end))
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
      this._isClosedPath = true

      const lastControls = this.getAnchorHandles(this.anchorCount - 1, false)
      lastControls.anchor.position = target.anchor.position

      Object
        .values(lastControls)
        .forEach((control) => control.visible = false)
    }
  }

  private _handleStartDragControl(type: HandlerType, shape: EllipseShape, anchorIndex: number): void {
    this.getFlatListHandlers().forEach(node => node.isListening = false)
    this._changeToActiveStyleControl(type, shape)
    this._captureInitialHandlePositions(anchorIndex)
  }

  private _handleFinishDragControl(type: HandlerType, shape: EllipseShape, anchorIndex: number): void {
    this.getFlatListHandlers().forEach(node => node.isListening = true)
    this._changeToIdleStyleControl(type, shape)
    this._unionRestrictionControls(shape, anchorIndex)
    this._recalculateSegmentsAfterMoving()
  }

  private _handleDragMoveControl(type: HandlerType, anchorIndex: number): void {
    switch (type) {
      case "anchor": {
        const handler = this.getAnchorHandles(anchorIndex)

        const layer = this.getLayerOrThrow()
        const stage = layer.getStageOrThrow()
        const currentPointerPosition = layer.screenToWorld(stage.absolutePositionCursor)

        const delta = currentPointerPosition.sub(handler.anchor.startDragPointerPosition)

        handler.inHandle.position = this._dragStartPositions.inHandle.add(delta)
        handler.outHandle.position = this._dragStartPositions.outHandle.add(delta)

        return
      }
      case "in": {
        const handler = this.getAnchorHandles(anchorIndex)

        handler.outHandle.position = handler.anchor.position
          .scale(2)
          .sub(handler.inHandle.position)

        return
      }
      case "out": {
        const handler = this.getAnchorHandles(anchorIndex)

        handler.inHandle.position = handler.anchor.position
          .scale(2)
          .sub(handler.outHandle.position)

        return
      }
    }
  }

  private _changeToActiveStyleControl(type: HandlerType, shape: EllipseShape): void {
    switch (type) {
      case "anchor": {
        shape.fillColor = "#f38ba8"
        shape.radius({ x: 7, y: 7 })
        return
      }
      case "in": {
        shape.fillColor = "#fab387"
        shape.radius({ x: 5, y: 5 })
        return
      }
      case "out": {
        shape.fillColor = "#fab387"
        shape.radius({ x: 5, y: 5 })
        return
      }
    }
  }

  private _changeToIdleStyleControl(type: HandlerType, shape: EllipseShape): void {
    switch (type) {
      case "anchor": {
        shape.fillColor = "#a6e3a1"
        shape.radius({ x: 5, y: 5 })
        return
      }
      case "in": {
        shape.fillColor = "#f9e2af"
        shape.radius({ x: 4, y: 4 })
        return
      }
      case "out": {
        shape.fillColor = "#f9e2af"
        shape.radius({ x: 4, y: 4 })
        return
      }
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

    this._drawHandleGuides(context)
  }

  private _shouldDrawPreviewSegment(): boolean {
    return this._isDrawingMode && !this._isClosedPath && !this._activeControlIndex
  }

  private _shouldDrawInteractiveSegment(): boolean {
    return !!this._activeControlIndex && this._activeControlIndex > 0
  }

  private _applyActiveStrokeStyle(context: CanvasRenderingContext2D): void {
    context.strokeStyle = "red"
    context.lineWidth = 3
  }

  private _drawPreviewSegment(context: CanvasRenderingContext2D): void {
    const layer = this.getLayerOrThrow()
    const currentPointerPosition = layer.screenToWorld(layer.getStageOrThrow().absolutePositionCursor)

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
    const prevHandles = this.getAnchorHandles(this._activeControlIndex! - 1)
    const currentHandles = this.getAnchorHandles(this._activeControlIndex!)

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
      if (this._isClosedPath && i === totalAnchors - 1) continue

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

    if (this._isClosedPath) {
      context.fillStyle = "rgba(137,180,250,0.06)"
      context.fill()
    }

    context.restore()
  }
}
