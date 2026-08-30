// import { isEmpty, isNil, isUndefined } from "lodash"
// import { Group } from "../Group"
// import { Point, type PointData } from "../maths/Point"
// import { EllipseShape } from "../shapes/Ellipse"
// import { PolygonShape } from "../shapes/Polygon"
// import { LayerV2 } from "../LayerV2"
// import { SimObject } from "../world/sim-object"
// import type { EventObject } from "../behaviors/EventBehavior"

// const currentPointerPosition = new Point(0, 0)

// const _convertHandlersToPoints = (start: HandlerChild, end: HandlerChild): Array<Point> => {
//   return Object
//     .values(start)
//     .concat(Object.values(end))
//     .map((handler) => handler.position)
// }

// type HandlerChild = {
//   anchor: EllipseShape,
//   inHandle: EllipseShape,
//   outHandle: EllipseShape
// }

// type NextChildrenRecord = {
//   segments: Array<PolygonShape>,
//   handlers: Array<HandlerChild>
// }

// const getPointerLocalPosition = (event: PointerEvent) => {
//   const rect = event.target instanceof HTMLElement
//     ? event.target.getBoundingClientRect()
//     : { left: 0, top: 0 }

//   return Point.fromData({
//     x: event.clientX - rect.left,
//     y: event.clientY - rect.top,
//   })
// }

// export class CubicBezierPath extends Group {
//   public readonly toolType = "cubic" as const

//   private _dragStartWorldPosition: Point = Point.zero()
//   private _activeControlIndex: number | null = null
//   private __isDrawingMode: boolean = false
//   private _isClosedPath: boolean = false

//   private __nextChildrenRecord: NextChildrenRecord = {
//     handlers: [],
//     segments: [],
//   }

//   private _buildAndPushSegment(points: Array<PointData>) {
//     const layer = this.getLayerOrThrow()
//     const segment = new PolygonShape({
//       initialPoints: points,
//       closed: false,
//       cubic: true,
//     })

//     segment.lineWidth = 2.5
//     segment.fillColor = "none"
//     segment.strokeColor = "transparent"

//     segment.on("pointerover", () => {
//       segment.strokeColor = "#3b6ae830"
//       segment.lineWidth = 14
//     })

//     segment.on("pointerleave", () => {
//       segment.strokeColor = "transparent"
//       segment.lineWidth = 2.5
//     })

//     segment.layer(layer)
//     this.__nextChildrenRecord.segments.push(segment)
//   }

//   private _pushHandler(handler: HandlerChild) {
//     this.__nextChildrenRecord.handlers.push(handler)
//   }

//   public _dragStartPositions = {
//     anchor: Point.zero(),
//     inHandle: Point.zero(),
//     outHandle: Point.zero(),
//   } as const

//   public get anchorCount(): number {
//     return this.__nextChildrenRecord.handlers.length
//   }

//   public get _isDrawingMode() {
//     return this.__isDrawingMode
//   }

//   public set _isDrawingMode(value: boolean) {
//     this.__isDrawingMode = value
//   }

//   private _unsubscribe: (() => void ) | null = null

//   public constructor() {
//     super()

//     this.on("addToParent", () => {
//       const layer = this.getLayerOrThrow()

//       window.addEventListener("pointermove", (event) => {
//         currentPointerPosition.copyFrom(layer.screenToWorld(getPointerLocalPosition(event)))
//       })

//       this._unsubscribe = this.addBezierToolEditorEvents()
//     })
//   }

//   public addBezierToolEditorEvents() {
//     const layer = this.getLayerOrThrow()

//     const downCallback = (event: EventObject) => this._handlePointerDown(event.evt as PointerEvent)
//     const moveCallback = (event: EventObject) => this._handlePointerMove(event.evt as PointerEvent)
//     const upCallback = (event: EventObject) => this._handlePointerUp(event.evt as PointerEvent)

//     const keydownCallback = (event: KeyboardEvent) => this._handleKeyDown(event)

//     layer.on("pointerdown", downCallback)
//     layer.on("pointermove", moveCallback)
//     layer.on("pointerup", upCallback)

//     window.addEventListener("keydown", keydownCallback)

//     return () => {
//       layer.off("pointerdown", downCallback)
//       layer.off("pointermove", moveCallback)
//       layer.off("pointerup", upCallback)

//       window.removeEventListener("keydown", keydownCallback)
//     }
//   }

//   public fromShape(shape: PolygonShape) {
//     const layer = this.getLayerOrThrow();
//     const points = shape.pointsToTrace
//     const length = points.length;

//     for (let i = 0; i < length; i += 3) {
//       const anchor = points[i];
//       const inHandle = points[i + 1];
//       const outHandle = points[i + 2];

//       const anchorIndex = i / 3

//       const node = this._createSingleControlHandle(layer, anchor, anchorIndex, this.HANDLE_CONFIGURATIONS[0]);
//       const nodeIn = this._createSingleControlHandle(layer, inHandle, anchorIndex, this.HANDLE_CONFIGURATIONS[1]);
//       const nodeOut = this._createSingleControlHandle(layer, outHandle, anchorIndex, this.HANDLE_CONFIGURATIONS[2]);

//       node.isListening = true
//       nodeIn.isListening = true
//       nodeOut.isListening = true

//       this._pushHandler({
//         anchor: node,
//         inHandle: nodeIn,
//         outHandle: nodeOut,
//       })

//       const nextPoints = points.slice(i, i + 6)

//       if (nextPoints.length === 6) {
//         this._buildAndPushSegment(nextPoints)
//       }
//     }
//   }

//   private _recalculateSegmentsAfterMoving(anchorIndex: number) {
//     const { segments, handlers } = this.__nextChildrenRecord

//     segments.forEach((segment, index) => {
//       const needRemapRestriction = this._isClosedPath && index === segments.length - 1

//       const start = handlers[index]
//       const end = handlers[needRemapRestriction ? 0 : index + 1]

//       segment.setPoints(_convertHandlersToPoints(start, end))
//     })
//   }

//   public toShape() {

//   }

//   private readonly HANDLE_CONFIGURATIONS = [
//     {
//       defaultRadius: 5,
//       handleType: "anchor",
//       initialColor: "#a6e3a1",
//       onDragStart: this._captureInitialHandlePositions.bind(this),
//       onDragMove: (_shape: EllipseShape, idx: number): void => {
//         const { anchor, inHandle, outHandle } = this._getAnchorHandles(idx)

//         const delta = currentPointerPosition.sub(anchor.startDragPointerPosition)
//         // console.log(delta)

//         inHandle.position = this._dragStartPositions.inHandle.add(delta)
//         outHandle.position = this._dragStartPositions.outHandle.add(delta)

//         // if (idx === this.anchorCount - 1) {
//         //   const first = this._getAnchorHandles(0)

//         //   first.anchor.position = anchor.position
//         //   first.inHandle.position = inHandle.position
//         //   first.outHandle.position = outHandle.position
//         // }
//       },
//       applyActiveStyle: (shape: EllipseShape): void => {
//         shape.fillColor = "#f38ba8"
//         shape.radius({ x: 7, y: 7 })
//       },
//       applyIdleStyle: (shape: EllipseShape): void => {
//         shape.fillColor = "#a6e3a1"
//         shape.radius({ x: 5, y: 5 })
//       },
//     },

//     {
//       defaultRadius: 4,
//       handleType: "in",
//       initialColor: "#f9e2af",
//       onDragStart: this._captureInitialHandlePositions.bind(this),
//       onDragMove: (_shape: EllipseShape, idx: number): void => {
//         const { anchor, inHandle, outHandle } = this._getAnchorHandles(idx)

//         outHandle.position = anchor.position
//           .scale(2)
//           .sub(inHandle.position)

//         // if (idx === this.anchorCount - 1) {
//         //   const first = this._getAnchorHandles(0)
//         //   first.inHandle.position = inHandle.position
//         //   first.outHandle.position = outHandle.position
//         // }
//       },
//       applyActiveStyle: (shape: EllipseShape): void => {
//         shape.fillColor = "#fab387"
//         shape.radius({ x: 5, y: 5 })
//       },
//       applyIdleStyle: (shape: EllipseShape): void => {
//         shape.fillColor = "#f9e2af"
//         shape.radius({ x: 4, y: 4 })
//       },
//     },

//     {
//       defaultRadius: 4,
//       handleType: "out",
//       initialColor: "#f9e2af",
//       onDragStart: this._captureInitialHandlePositions.bind(this),
//       onDragMove: (_shape: EllipseShape, idx: number): void => {
//         const { anchor, inHandle, outHandle } = this._getAnchorHandles(idx)

//         inHandle.position = anchor.position
//           .scale(2)
//           .sub(outHandle.position)

//         // if (idx === this.anchorCount - 1) {
//         //   const first = this._getAnchorHandles(0)
//         //   first.inHandle.position = inHandle.position
//         //   first.outHandle.position = outHandle.position
//         // }
//       },
//       applyActiveStyle: (shape: EllipseShape): void => {
//         shape.fillColor = "#fab387"
//         shape.radius({ x: 5, y: 5 })
//       },
//       applyIdleStyle: (shape: EllipseShape): void => {
//         shape.fillColor = "#f9e2af"
//         shape.radius({ x: 4, y: 4 })
//       }
//     }
//   ] as const

//   public children(): Array<SimObject>
//   public children(...list: Array<SimObject>): void
//   public children(...list: Array<SimObject>): Array<SimObject> | void {
//     if (isEmpty(list)) {
//       return [
//         ...this.__nextChildrenRecord.segments,
//         ...this.__nextChildrenRecord.handlers.flatMap((handler) => Object.values(handler)),
//       ]
//     }

//     return
//   }

//   private get _handlers() {
//     return this.findObjectsByName("handle-shape") as Array<EllipseShape>
//   }

//   public _getAnchorHandles(anchorIndex: number, treatAsClosed: boolean = true) {
//     const index = treatAsClosed && this._isClosedPath && anchorIndex === this.anchorCount - 1
//       ? 0
//       : anchorIndex

//     return this.__nextChildrenRecord.handlers[index]
//   }

//   private _captureInitialHandlePositions(anchorIndex: number) {
//     const { anchor, inHandle, outHandle } = this._getAnchorHandles(anchorIndex)

//     anchor.position.copyTo(this._dragStartPositions.anchor)
//     inHandle.position.copyTo(this._dragStartPositions.inHandle)
//     outHandle.position.copyTo(this._dragStartPositions.outHandle)
//   }

//   private _createControlHandles(position: PointData): Array<EllipseShape> {
//     const layer = this.getLayerOrThrow()
//     const anchorIndex = this.anchorCount

//     return this.HANDLE_CONFIGURATIONS.map((props) => {
//       return this._createSingleControlHandle(layer, position, anchorIndex, props)
//     })
//   }

//   private _createSingleControlHandle(
//     layer: LayerV2,
//     position: PointData,
//     anchorIndex: number,
//     params: typeof this.HANDLE_CONFIGURATIONS[number]
//   ) {
//     const { initialColor, defaultRadius, applyActiveStyle, applyIdleStyle, onDragMove, onDragStart } = params

//     const handleShape = new EllipseShape(position.x, position.y, defaultRadius, defaultRadius)

//     handleShape.isListening = false
//     handleShape.fillColor = initialColor

//     handleShape.layer(layer)
//     handleShape.subscribe(handleShape)
//     handleShape.addClassname("handle-shape")

//     handleShape.on("pointerover", () => document.body.style.cursor = "move")
//     handleShape.on("pointerout", () => document.body.style.cursor = "auto")

//     handleShape.on("processDrag", () => onDragMove(handleShape, anchorIndex))

//     handleShape.on("startDrag", () => {
//       this._handlers.forEach((handler) => handler.isListening = false)

//       applyActiveStyle(handleShape)
//       onDragStart(anchorIndex)
//     })

//     handleShape.on("finishDrag", () => {
//       this._handlers.forEach((handler) => handler.isListening = true)

//       this._unionRestrictionControls(handleShape, anchorIndex)
//       this._recalculateSegmentsAfterMoving(anchorIndex)

//       applyIdleStyle(handleShape)
//     })

//     return handleShape
//   }

//   private _unionRestrictionControls(shape: EllipseShape, anchorIndex: number) {
//     const isRestrict = (anchorIndex === 0) || (this.anchorCount - 1)
//     if (!isRestrict) return

//     const first = this._getAnchorHandles(0, false)
//     const distance = shape.position.sub(first.anchor.position).length()

//     if (distance <= 7) {
//       this._isClosedPath = true

//       const lastControls = this._getAnchorHandles(this.anchorCount - 1, false)
//       lastControls.anchor.position = first.anchor.position

//       Object
//         .values(lastControls)
//         .forEach((control) => control.visible = false)
//     }
//   }

//   private _handlePointerDown(event: PointerEvent): void {
//     const point = this
//       .getLayerOrThrow()
//       .screenToWorld(getPointerLocalPosition(event))

//     const handlers = this._createControlHandles(point)

//     this._pushHandler({
//       anchor: handlers[0],
//       inHandle: handlers[1],
//       outHandle: handlers[2],
//     })

//     if (this._isDrawingMode) {
//       this._dragStartWorldPosition.copyFrom(point)
//       this._activeControlIndex = this.anchorCount - 1
//     } else {
//       this._isClosedPath = false
//       this._isDrawingMode = true
//     }
//   }

//   public _handlePointerMove(_event: PointerEvent): void {
//     if (isNil(this._activeControlIndex)) return

//     const dragDelta = currentPointerPosition.sub(this._dragStartWorldPosition)

//     const { anchor, inHandle, outHandle } = this._getAnchorHandles(this._activeControlIndex)

//     inHandle.position = anchor.position.sub(dragDelta)
//     outHandle.position = anchor.position.add(dragDelta)
//   }

//   private _handlePointerUp(_event: PointerEvent): void {
//     if (this._activeControlIndex !== null) {
//       const { anchor, inHandle, outHandle } = this._getAnchorHandles(this._activeControlIndex)

//       const dragDistance = currentPointerPosition.sub(this._dragStartWorldPosition)

//       if (dragDistance.length() < 3) {
//         inHandle.position = anchor.position.clone()
//         outHandle.position = anchor.position.clone()
//       }

//       this._dragStartWorldPosition.set(0, 0)
//       this._activeControlIndex = null
//     }
//   }

//   private _handleKeyDown(event: KeyboardEvent): void {
//     if (event.key === "Escape") {
//       this._isDrawingMode = false
//       this._activeControlIndex = null
//       this._handlers.forEach((handler) => handler.isListening = true)

//       this._unsubscribe?.()

//       const handlers = this.__nextChildrenRecord.handlers

//       for (let anchorIndex = 0; anchorIndex < handlers.length; anchorIndex++) {
//         const current = handlers[anchorIndex]
//         const next = handlers[anchorIndex + 1]

//         if (isUndefined(next)) return

//         this._buildAndPushSegment(_convertHandlersToPoints(current, next))
//       }
//     }
//   } 

//   public render(context: CanvasRenderingContext2D): void {
//     super.render(context)

//     if (this._handlers.length === 0) return

//     this._drawMainPath(context, "b")

//     if (this._shouldDrawPreviewSegment()) this._drawPreviewSegment(context)
//     else if (this._shouldDrawInteractiveSegment()) this._drawInteractiveSegment(context)

//     this._drawHandleGuides(context)
//   }

//   private _shouldDrawPreviewSegment(): boolean {
//     return this._isDrawingMode && !this._isClosedPath && !this._activeControlIndex
//   }

//   private _shouldDrawInteractiveSegment(): boolean {
//     return !!this._activeControlIndex && this._activeControlIndex > 0
//   }

//   private _applyActiveStrokeStyle(context: CanvasRenderingContext2D): void {
//     context.strokeStyle = "red"
//     context.lineWidth = 3
//   }

//   private _drawPreviewSegment(context: CanvasRenderingContext2D): void {
//     const currentMousePos = currentPointerPosition.clone()
//     const prevAnchorHandles = this._getAnchorHandles(this.anchorCount - 1, false)

//     context.beginPath()
//     context.moveTo(prevAnchorHandles.anchor.x, prevAnchorHandles.anchor.y)

//     context.bezierCurveTo(
//       ...prevAnchorHandles.outHandle.position.array(),
//       ...currentMousePos.array(),
//       ...currentMousePos.array(),
//     )

//     this._applyActiveStrokeStyle(context)
//     context.stroke()
//   }

//   private _drawInteractiveSegment(context: CanvasRenderingContext2D): void {
//     const prevHandles = this._getAnchorHandles(this._activeControlIndex! - 1)
//     const currentHandles = this._getAnchorHandles(this._activeControlIndex!)

//     context.beginPath()
//     context.moveTo(prevHandles.anchor.x, prevHandles.anchor.y)

//     context.bezierCurveTo(
//       ...prevHandles.outHandle.position.array(),
//       ...currentHandles.inHandle.position.array(),
//       ...currentHandles.anchor.position.array()
//     )

//     this._applyActiveStrokeStyle(context)
//     context.stroke()
//   }

//   private _drawHandleGuides(context: CanvasRenderingContext2D): void {
//     context.setLineDash([3, 3])
//     context.strokeStyle = "#4a4a5e"
//     context.lineWidth = 1.2

//     const totalAnchors = this.anchorCount

//     for (let i = 0; i < totalAnchors; i++) {
//       if (this._isClosedPath && i === totalAnchors - 1) continue

//       const { anchor, inHandle, outHandle } = this._getAnchorHandles(i)

//       context.beginPath()
//       context.moveTo(anchor.x, anchor.y)
//       context.lineTo(inHandle.x, inHandle.y)
//       context.stroke()

//       context.beginPath()
//       context.moveTo(anchor.x, anchor.y)
//       context.lineTo(outHandle.x, outHandle.y)
//       context.stroke()
//     }

//     context.setLineDash([])
//   }

//   private _drawMainPath(context: CanvasRenderingContext2D, t: "a" | "b"): void {
//     const firstHandles = this._getAnchorHandles(0)

//     const totalAnchors = this.anchorCount

//     context.save()
//     context.beginPath()
//     context.moveTo(firstHandles.anchor.x, firstHandles.anchor.y)

//     for (let i = 1; i < totalAnchors; i++) {
//       const prevHandles = this._getAnchorHandles(i - 1)
//       const currentHandles = this._getAnchorHandles(i)

//       context.bezierCurveTo(
//         ...prevHandles.outHandle.position.array(),
//         ...currentHandles.inHandle.position.array(),
//         ...currentHandles.anchor.position.array(),
//       )
//     }

//     ; ({
//       a: () => {
//         context.strokeStyle = "#3b6ae8"
//         context.globalAlpha = 0.3
//         context.lineWidth = 14
//       },
//       b: () => {
//         context.strokeStyle = "#000"
//         context.lineWidth = 2.5
//       }
//     })[t]()

//     context.lineJoin = "round"
//     context.lineCap = "round"
//     context.stroke()

//     if (this._isClosedPath) {
//       context.fillStyle = "rgba(137,180,250,0.06)"
//       context.fill()
//     }

//     context.restore()
//   }
// }
