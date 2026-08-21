import { isNil } from "lodash"
import { Group } from "../Group"
import { Point, type PointData } from "../maths/Point"
import { EllipseShape } from "../shapes/Ellipse"

const currentPointerPosition = new Point(0, 0)

const getPointerLocalPosition = (event: PointerEvent) => {
  const rect = event.target instanceof HTMLElement
    ? event.target.getBoundingClientRect()
    : { left: 0, top: 0 }

  return Point.fromData({
    x: event.clientX - rect.left,
    y: event.clientY - rect.top,
  })
}

export class CubicBezierPath extends Group {
  public readonly toolType = "cubic" as const

  private _isClosedPath: boolean = false
  private _dragStartWorldPosition: Point = Point.zero()
  private _activeControlIndex: number | null = null
  private _isDrawingMode: boolean = false

  private _dragStartPositions = {
    anchor: Point.zero(),
    inHandle: Point.zero(),
    outHandle: Point.zero(),
  } as const

  public get anchorCount(): number {
    return this.children().length / 3
  }

  public constructor() {
    super()

    this.on("addToParent", () => {
      const layer = this.getLayerOrThrow()

      layer.on("pointerdown", (event) => {
        currentPointerPosition.copyFrom(layer.screenToWorld(getPointerLocalPosition(event.evt as PointerEvent)))
        this._handlePointerDown(event.evt as PointerEvent)
      })

      layer.on("pointermove", (event) => {
        currentPointerPosition.copyFrom(layer.screenToWorld(getPointerLocalPosition(event.evt as PointerEvent)))
        this._handlePointerMove(event.evt as PointerEvent)
      })

      layer.on("pointerup", (event) => {
        currentPointerPosition.copyFrom(layer.screenToWorld(getPointerLocalPosition(event.evt as PointerEvent)))
        this._handlePointerUp(event.evt as PointerEvent)
      })

      window.addEventListener("keydown", (event) => {
        this._handleKeyDown(event)
      })
    })
  }

  private readonly HANDLE_CONFIGURATIONS = [
    {
      defaultRadius: 5,
      handleType: "anchor",
      onDragStart: this._captureInitialHandlePositions.bind(this),
      onDragMove: (_shape: EllipseShape, idx: number): void => {
        const { anchor, inHandle, outHandle } = this._getAnchorHandles(idx)

        const delta = currentPointerPosition.sub(anchor.startDragPointerPosition)

        inHandle.position = this._dragStartPositions.inHandle.add(delta)
        outHandle.position = this._dragStartPositions.outHandle.add(delta)
      },
      applyActiveStyle: (shape: EllipseShape): void => {
        shape.fillColor = "#f38ba8"
        shape.radius({ x: 7, y: 7 })
      },
      applyIdleStyle: (shape: EllipseShape): void => {
        shape.fillColor = "#a6e3a1"
        shape.radius({ x: 5, y: 5 })
      },
    },

    {
      defaultRadius: 4,
      handleType: "in",
      onDragStart: this._captureInitialHandlePositions.bind(this),
      onDragMove: (_shape: EllipseShape, idx: number): void => {
        const { anchor, inHandle, outHandle } = this._getAnchorHandles(idx)

        outHandle.position = anchor.position
          .scale(2)
          .sub(inHandle.position)
      },
      applyActiveStyle: (shape: EllipseShape): void => {
        shape.fillColor = "#fab387"
        shape.radius({ x: 5, y: 5 })
      },
      applyIdleStyle: (shape: EllipseShape): void => {
        shape.fillColor = "#f9e2af"
        shape.radius({ x: 4, y: 4 })
      },
    },

    {
      defaultRadius: 4,
      handleType: "out",
      onDragStart: this._captureInitialHandlePositions.bind(this),
      onDragMove: (_shape: EllipseShape, idx: number): void => {
        const { anchor, inHandle, outHandle } = this._getAnchorHandles(idx)

        inHandle.position = anchor.position
          .scale(2)
          .sub(outHandle.position)
      },
      applyActiveStyle: (shape: EllipseShape): void => {
        shape.fillColor = "#fab387"
        shape.radius({ x: 5, y: 5 })
      },
      applyIdleStyle: (shape: EllipseShape): void => {
        shape.fillColor = "#f9e2af"
        shape.radius({ x: 4, y: 4 })
      }
    }
  ] as const

  private _getAnchorHandles(anchorIndex: number, treatAsClosed: boolean = true) {
    const baseIndex = anchorIndex * 3;
    const shapes = super.children() as Array<EllipseShape>
    const anchor = shapes[baseIndex]

    if (treatAsClosed && anchorIndex === this.anchorCount - 1 && this._isClosedPath) {
      return {
        anchor: shapes[0],
        inHandle: shapes[1],
        outHandle: shapes[2],
      }
    }

    const inHandle = shapes[baseIndex + 1]
    const outHandle = shapes[baseIndex + 2]

    return {
      anchor,
      inHandle,
      outHandle,
    }
  }

  private _captureInitialHandlePositions(anchorIndex: number) {
    const { anchor, inHandle, outHandle } = this._getAnchorHandles(anchorIndex)

    anchor.position.copyTo(this._dragStartPositions.anchor)
    inHandle.position.copyTo(this._dragStartPositions.inHandle)
    outHandle.position.copyTo(this._dragStartPositions.outHandle)
  }

  private _createControlHandles(position: PointData): Array<EllipseShape> {
    const layer = this.getLayerOrThrow()
    const anchorIndex = this.anchorCount

    return this.HANDLE_CONFIGURATIONS.map(({
      defaultRadius,
      applyActiveStyle,
      applyIdleStyle,
      onDragStart,
      onDragMove
    }) => {
      const handleShape = new EllipseShape(position.x, position.y, defaultRadius, defaultRadius)

      handleShape.isListening = false
      handleShape.fillColor = "#a6e3a1"

      handleShape.layer(layer)
      handleShape.subscribe(handleShape)

      handleShape.on("pointerover", () => document.body.style.cursor = "move")
      handleShape.on("pointerout", () => document.body.style.cursor = "auto")

      handleShape.on("processDrag", () => onDragMove(handleShape, anchorIndex))

      handleShape.on("startDrag", () => {
        this.children().forEach(child => child.isListening = false)

        applyActiveStyle(handleShape)
        onDragStart(anchorIndex)
      })

      handleShape.on("finishDrag", () => {
        this.children().forEach(child => child.isListening = true)

        const isLast = anchorIndex === this.anchorCount - 1
        const first = this._getAnchorHandles(0, false)

        applyIdleStyle(handleShape)

        if (isLast) {
          const distance = handleShape.position.sub(first.anchor.position).length()

          if (distance <= 7) {
            this._isClosedPath = true

            const lastControls = this._getAnchorHandles(anchorIndex, false)
            lastControls.anchor.position = first.anchor.position

            Object
              .values(lastControls)
              .forEach((control) => {
                control.visible = false
              })
          }
        }
      })

      return handleShape
    })
  }

  private _handlePointerDown(event: PointerEvent): void {
    const point = this
      .getLayerOrThrow()
      .screenToWorld(getPointerLocalPosition(event))

    if (this._isDrawingMode) {
      this.children(...this._createControlHandles(point))

      this._dragStartWorldPosition.copyFrom(point)
      this._activeControlIndex = this.anchorCount - 1
    } else {
      this.children(...this._createControlHandles(point))

      this._isClosedPath = false
      this._isDrawingMode = true
    }
  }

  public _handlePointerMove(_event: PointerEvent): void {
    if (isNil(this._activeControlIndex)) return

    const dragDelta = currentPointerPosition.sub(this._dragStartWorldPosition)

    const { anchor, inHandle, outHandle } = this._getAnchorHandles(this._activeControlIndex)

    inHandle.position = anchor.position.sub(dragDelta)
    outHandle.position = anchor.position.add(dragDelta)
  }

  private _handlePointerUp(_event: PointerEvent): void {
    if (this._activeControlIndex !== null) {
      const { anchor, inHandle, outHandle } = this._getAnchorHandles(this._activeControlIndex)

      const dragDistance = currentPointerPosition.sub(this._dragStartWorldPosition)

      if (dragDistance.length() < 3) {
        inHandle.position = anchor.position.clone()
        outHandle.position = anchor.position.clone()
      }

      this._dragStartWorldPosition.set(0, 0)
      this._activeControlIndex = null
    }
  }

  private _handleKeyDown(event: KeyboardEvent): void {
    if (event.key === "Escape") {
      this._isDrawingMode = false
      this._activeControlIndex = null

      const children = this.children()

      children.forEach((child) => {
        if (EllipseShape.isEllipse(child)) {
          child.isListening = true
        }
      })
    }
  }

  public render(context: CanvasRenderingContext2D): void {
    if (this.children().length === 0) return

    super.render(context)

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
    const currentMousePos = currentPointerPosition.clone()
    const prevAnchorHandles = this._getAnchorHandles(this.anchorCount - 1, false)

    context.beginPath()
    context.moveTo(prevAnchorHandles.anchor.x, prevAnchorHandles.anchor.y)

    context.bezierCurveTo(
      ...prevAnchorHandles.outHandle.position.array(),
      ...currentMousePos.array(),
      ...currentMousePos.array(),
    )

    this._applyActiveStrokeStyle(context)
    context.stroke()
  }

  private _drawInteractiveSegment(context: CanvasRenderingContext2D): void {
    const prevHandles = this._getAnchorHandles(this._activeControlIndex! - 1)
    const currentHandles = this._getAnchorHandles(this._activeControlIndex!)

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

      const { anchor, inHandle, outHandle } = this._getAnchorHandles(i)

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
    const firstHandles = this._getAnchorHandles(0)

    const totalAnchors = this.anchorCount

    context.beginPath()
    context.moveTo(firstHandles.anchor.x, firstHandles.anchor.y)

    for (let i = 1; i < totalAnchors; i++) {
      const prevHandles = this._getAnchorHandles(i - 1)
      const currentHandles = this._getAnchorHandles(i)

      context.bezierCurveTo(
        ...prevHandles.outHandle.position.array(),
        ...currentHandles.inHandle.position.array(),
        ...currentHandles.anchor.position.array(),
      )
    }

    context.strokeStyle = "#89b4fa"
    context.lineWidth = 2.5
    context.lineJoin = "round"
    context.lineCap = "round"
    context.stroke()

    if (this._isClosedPath) {
      context.fillStyle = "rgba(137,180,250,0.06)"
      context.fill()
    }
  }
}
