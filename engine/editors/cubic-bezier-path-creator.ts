import { isNull } from "lodash"
import type { EventObject } from "../behaviors/EventBehavior"
import { Layer } from "../LayerV2"
import { Point } from "../maths/Point"
import { CubicBezierPath } from "./cubic-bezier-path"

export class CubicBezierPathCreator {
  public readonly toolType = "cubic" as const

  private _dragStartPointer: Point = Point.zero()
  private _prevHandlersLength: number = 0
  private _extendingPath: boolean = false

  private __path: CubicBezierPath | null = null
  private __activeControlIndex: number | null = null
  private __isDrawingMode: boolean = false

  private get _path(): CubicBezierPath {
    if (!this.__path) throw new Error("path is not defined")
    return this.__path
  }

  private set _path(value: CubicBezierPath | null) {
    this.__path = value
  }

  private set _activeControlIndex(value: number | null) {
    this.__activeControlIndex = value
    this._path.activeControlIndex = value
  }

  private set _isDrawingMode(value: boolean) {
    this.__isDrawingMode = value
    this._path.isDrawingMode = value
  }

  public constructor(private readonly layer: Layer) {
    this.bindEvents()
    this.subscribe()
  }

  public bindEvents(): void {
    this._handlePointerDown = this._handlePointerDown.bind(this)
    this._handlePointerMove = this._handlePointerMove.bind(this)
    this._handlePointerUp = this._handlePointerUp.bind(this)
    this._handleKeyDown = this._handleKeyDown.bind(this)
  }

  public subscribe(): void {
    this.layer.on("pointerdown", this._handlePointerDown)
    this.layer.on("pointermove", this._handlePointerMove)
    this.layer.on("pointerup", this._handlePointerUp)

    window.addEventListener("keydown", this._handleKeyDown)
  }

  public unsubscribe(): void {
    this.layer.off("pointerdown", this._handlePointerDown)
    this.layer.off("pointermove", this._handlePointerMove)
    this.layer.off("pointerup", this._handlePointerUp)

    window.removeEventListener("keydown", this._handleKeyDown)
  }

  private _handlePointerDown(_event: EventObject<PointerEvent>): void {
    if (isNull(this.__path)) {
      this._extendingPath = false
      this._path = new CubicBezierPath()
      this.layer.appendChild(this._path)
    }

    const pointer = this.layer.worldPointer
    this._dragStartPointer.copyFrom(pointer)

    const handler = this._path.buildAndPushHandler(this._path.anchorCount, [pointer, pointer, pointer])

    handler.anchor.emitter.on(handler.anchor.extendPathRoute, ({ payload }) => {
      this.__path = payload
      this._extendingPath = true
      this._isDrawingMode = true
    })

    if (this.__isDrawingMode) {
      this._activeControlIndex = this._path.anchorCount - 1
    } else {
      this._activeControlIndex = 0
      this._isDrawingMode = true
    }
  }

  public _handlePointerMove(_event: EventObject<PointerEvent>): void {
    if (isNull(this.__activeControlIndex)) return

    const dragDelta = this.layer.worldPointer.sub(this._dragStartPointer)
    const { anchor, inHandle, outHandle } = this._path.getAnchorHandles(this.__activeControlIndex)

    inHandle.position = anchor.position.sub(dragDelta)
    outHandle.position = anchor.position.add(dragDelta)
  }

  private _handlePointerUp(_event: EventObject<PointerEvent>): void {
    if (this.__activeControlIndex !== null) {
      const { anchor, inHandle, outHandle } = this._path.getAnchorHandles(this.__activeControlIndex)

      const dragDistance = this.layer.worldPointer.sub(this._dragStartPointer).length()

      if (dragDistance < 3) {
        inHandle.position = anchor.position.clone()
        outHandle.position = anchor.position.clone()
      }

      this._dragStartPointer.set(0, 0)
      this._activeControlIndex = null
    }
  }

  private _handleKeyDown(event: KeyboardEvent): void {
    if (event.key === "Escape") {
      const handlers = this._path.getFlatListHandlers()
      const points = handlers.map((handler) => handler.position)

      handlers.forEach((handler) => handler.isListening = true)

      const startIndex = this._extendingPath ? Math.max(this._prevHandlersLength - 3, 0) : 0

      for (let i = startIndex; i < points.length; i += 3) {
        const segmentPoints = points.slice(i, i + 6)

        if (segmentPoints.length === 6) {
          const segment = this._path.createSegment(segmentPoints)
          this._path.appendSegmentChild(segment)
        }
      }

      this._activeControlIndex = null
      this._isDrawingMode = false
      this._path = null

      this._prevHandlersLength = handlers.length
    }
  }
}
