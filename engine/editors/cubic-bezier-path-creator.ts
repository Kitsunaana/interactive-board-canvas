import { isNull } from "lodash"
import type { EventObject } from "../behaviors/EventBehavior"
import { LayerV2 } from "../LayerV2"
import { Point } from "../maths/Point"
import { CubicBezierPathV2 } from "./cubic-bezier-path-v2"

type Unsubscribe = () => void

export class CubicBezierPathCreator {
  public readonly toolType = "cubic" as const

  private _activeControlIndex: number | null = null
  private _dragStartPointer: Point = Point.zero()
  private _prevHandlersLength: number = 0
  private _isDrawingMode: boolean = false

  private _path: CubicBezierPathV2 | null = null

  public _dragStartPositions = {
    anchor: Point.zero(),
    inHandle: Point.zero(),
    outHandle: Point.zero(),
  } as const

  public constructor(private readonly layer: LayerV2) {
    this.addBezierToolEditorEvents()
  }

  public addBezierToolEditorEvents(): Unsubscribe {
    const downCallback = (event: EventObject<PointerEvent>) => this._handlePointerDown(event.evt)
    const moveCallback = (event: EventObject<PointerEvent>) => this._handlePointerMove(event.evt)
    const upCallback = (event: EventObject<PointerEvent>) => this._handlePointerUp(event.evt)

    const keydownCallback = (event: KeyboardEvent) => this._handleKeyDown(event)

    this.layer.on("pointerdown", downCallback)
    this.layer.on("pointermove", moveCallback)
    this.layer.on("pointerup", upCallback)

    window.addEventListener("keydown", keydownCallback)

    return () => {
      this.layer.off("pointerdown", downCallback)
      this.layer.off("pointermove", moveCallback)
      this.layer.off("pointerup", upCallback)

      window.removeEventListener("keydown", keydownCallback)
    }
  }

  private get path(): CubicBezierPathV2 {
    if (!this._path) throw new Error("path is not defined")
    return this._path
  }

  private set path(value: CubicBezierPathV2 | null) {
    this._path = value
  }

  private set activeControlIndex(value: number | null) {
    this._activeControlIndex = value
    this.path.activeControlIndex = value
  }

  private set isDrawingMode(value: boolean) {
    this._isDrawingMode = value
    this.path.isDrawingMode = value
  }

  private _handlePointerDown(_event: PointerEvent): void {
    if (isNull(this._path)) {
      this.path = new CubicBezierPathV2()
      this.layer.children(this.path)
    }

    const position = this.layer.worldPointer
    this._dragStartPointer.copyFrom(position)

    const pathId = this._path!.id

    const handler = this.path.buildAndPushHandler(this.path.anchorCount, [position, position, position], false)
    handler.anchor.on("pointerdown", (e) => this._extendPathFromLastAnchor(e, pathId))
    
    if (this._isDrawingMode) {
      this.activeControlIndex = this.path.anchorCount - 1
    } else {
      this.activeControlIndex = 0
      this.isDrawingMode = true
    }
  }

  private _extendPathFromLastAnchor({ target }: EventObject, pathId: string) {
    const path = this.layer
      .children()
      .find((child) => child.id === pathId) as CubicBezierPathV2 | undefined

    if (!path) return

    const handlers = path.childrenRecord.handlers
    const isLast = handlers[handlers.length - 1].anchor === target

    if (!isLast) return

    this._path = path
    this.isDrawingMode = true
  }

  public _handlePointerMove(_event: PointerEvent): void {
    if (isNull(this._activeControlIndex)) return

    const dragDelta = this.layer.worldPointer.sub(this._dragStartPointer)
    const { anchor, inHandle, outHandle } = this.path.getAnchorHandles(this._activeControlIndex)

    inHandle.position = anchor.position.sub(dragDelta)
    outHandle.position = anchor.position.add(dragDelta)
  }

  private _handlePointerUp(_event: PointerEvent): void {
    if (this._activeControlIndex !== null) {
      const { anchor, inHandle, outHandle } = this.path.getAnchorHandles(this._activeControlIndex)

      const dragDistance = this.layer.worldPointer.sub(this._dragStartPointer).length()

      if (dragDistance < 3) {
        inHandle.position = anchor.position.clone()
        outHandle.position = anchor.position.clone()
      }

      this._dragStartPointer.set(0, 0)
      this.activeControlIndex = null
    }
  }

  private _handleKeyDown(event: KeyboardEvent): void {
    if (event.key === "Escape") {
      this.isDrawingMode = false
      this.activeControlIndex = null

      const handlers = this.path.getFlatListHandlers()
      const points = handlers.map((handler) => handler.position)
      
      handlers.forEach((handler) => handler.isListening = true)

      for (let i = this._prevHandlersLength - 3; i < points.length; i += 3) {
        const segmentPoints = points.slice(i, i + 6)

        if (segmentPoints.length === 6) {
          this.path.buildAndPushSegment(segmentPoints)
        }
      }

      this._prevHandlersLength = handlers.length
      this.path = null
    }
  }

}
