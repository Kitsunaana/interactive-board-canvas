import { Point } from "../maths"
import { getPointFromEvent } from "../shared/point"
import { SimObject } from "../world/sim-object"
import { EventBehavior, type EventObject } from "./EventBehavior"

export abstract class Draggable {
  public abstract onStart(event: PointerEvent): void
  public abstract onProcess(event: PointerEvent): void
  public abstract onFinish(event: PointerEvent): void

  private _isDragging: boolean = false

  protected _translate: Point = new Point()
  protected _startPosition: Point = new Point()
  protected _currentPosition: Point = new Point()

  public get isDragging() {
    return this._isDragging
  }

  public subscribe(target: EventBehavior): void {
    target.on("pointerdown", this._handleDown)
  }

  public unsubscribe(target: EventBehavior): void {
    target.off("pointerdown", this._handleDown)
    target.off("pointermove", this._handleMove)
    target.off("pointerup", this._handleUp)
  }

  protected bindEvents() {
    this._handleDown = this._handleDown.bind(this)
    this._handleMove = this._handleMove.bind(this)
    this._handleUp = this._handleUp.bind(this)
  }

  private _handleMove(event: PointerEvent): void {
    this._currentPosition.copyFrom(this._getPointerPosition(event))
    const delta = this._currentPosition.sub(this._startPosition)

    this._translate.copyFrom(delta)

    this.onProcess(event)
  }

  private _handleUp(event: PointerEvent): void {
    this._translate.copyFrom(Point.zero())
    this._isDragging = false

    this.onFinish(event)

    window.removeEventListener("pointermove", this._handleMove)
    window.removeEventListener("pointerup", this._handleUp)
  }

  private _handleDown(event: EventObject): void {
    this._isDragging = true

    this._startPosition.copyFrom(this._getPointerPosition(event.evt as PointerEvent))

    this.onStart(event.evt as PointerEvent)

    window.addEventListener("pointermove", this._handleMove)
    window.addEventListener("pointerup", this._handleUp)
  }

  private _getPointerPosition(event: PointerEvent) {
    const point = Point.fromData(getPointFromEvent(event))

    if (this instanceof SimObject) {
      try {
        const layer = this.getLayerOrThrow()
        layer
          .screenToWorld(point)
          .copyTo(point)
      } catch (error) { }
    }

    return point
  }
}
