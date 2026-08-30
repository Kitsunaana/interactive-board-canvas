import { isNull } from "lodash"
import type { EventObject } from "../behaviors/EventBehavior"
import { LayerV2 } from "../LayerV2"
import { Point } from "../maths/Point"
import { CubicBezierPathV2 } from "./cubic-bezier-path-v2"

type Unsubscribe = () => void

export class CubicBezierPathCreator {
  public readonly toolType = "cubic" as const

  public _dragStartPositions = {
    anchor: Point.zero(),
    inHandle: Point.zero(),
    outHandle: Point.zero(),
  } as const

  public constructor(private readonly layer: LayerV2) {
    this.addBezierToolEditorEvents()
  }

  public addBezierToolEditorEvents(): Unsubscribe {
    const downCallback = (event: EventObject) => this._handlePointerDown(event.evt as PointerEvent)
    const moveCallback = (event: EventObject) => this._handlePointerMove(event.evt as PointerEvent)
    const upCallback = (event: EventObject) => this._handlePointerUp(event.evt as PointerEvent)

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

  private _dragStartPointer: Point = Point.zero()
  private _activeControlIndex: number | null = null
  private _path: CubicBezierPathV2 | null = null
  private _isDrawingMode: boolean = false

  private _handlePointerDown(_event: PointerEvent): void {
    if (isNull(this._path)) {
      this._path = new CubicBezierPathV2()
      this.layer.children(this._path)
    }

    const position = this.layer.worldPointer

    this._dragStartPointer.copyFrom(position)

    if (this._isDrawingMode) {
      this._path.buildAndPushHandler(this._path.anchorCount, [position, position, position], false)
      this._activeControlIndex = this._path.anchorCount - 1
    } else {
      this._path.buildAndPushHandler(0, [position, position, position], false)
      this._activeControlIndex = 0
      this._isDrawingMode = true
    }
  }

  public _handlePointerMove(_event: PointerEvent): void {
    if (isNull(this._activeControlIndex)) return

    const dragDelta = this.layer.worldPointer.sub(this._dragStartPointer)
    const { anchor, inHandle, outHandle } = this._path!.getAnchorHandles(this._activeControlIndex)

    inHandle.position = anchor.position.sub(dragDelta)
    outHandle.position = anchor.position.add(dragDelta)
  }

  private _handlePointerUp(_event: PointerEvent): void {
    if (this._activeControlIndex !== null) {
      const { anchor, inHandle, outHandle } = this._path!.getAnchorHandles(this._activeControlIndex)

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
      this._isDrawingMode = false
      this._activeControlIndex = null

      this._path!.getFlatListHandlers().forEach((handler) => {
        handler.isListening = true
      })

      this._path = null
    }
  }

}
