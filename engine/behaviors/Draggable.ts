import { isUndefined } from "lodash"
import { EventBehavior, type EventObject } from "./EventBehavior"
import { Point } from "../maths"
import { getPointFromEvent } from "../shared/point"

export abstract class Draggable extends EventBehavior {
  public abstract onStart(event: PointerEvent): void
  public abstract onProcess(event: PointerEvent): void
  public abstract onFinish(event: PointerEvent): void

  private _canDragging: boolean = false

  protected _translate: Point = new Point()
  protected _startPosition: Point = new Point()
  protected _currentPosition: Point = new Point()

  protected bindEvents() {
    this._handleDown = this._handleDown.bind(this)
    this._handleMove = this._handleMove.bind(this)
    this._handleUp = this._handleUp.bind(this)
  }

  private _handleMove(event: PointerEvent): void {
    this._currentPosition.copyFrom(Point.fromData(getPointFromEvent(event)))
    const delta = this._currentPosition.sub(this._startPosition)

    this._translate.copyFrom(delta)

    this.onProcess(event)
    this.fire("drag.process", { event })
  }

  private _handleUp(event: PointerEvent): void {
    this._translate.copyFrom(Point.zero())

    this.onFinish(event)
    this.fire("drag.end", { event })

    window.removeEventListener("pointermove", this._handleMove)
    window.removeEventListener("pointerup", this._handleUp)
  }

  private _handleDown(event: EventObject): void {
    this._startPosition.copyFrom(Point.fromData(getPointFromEvent(event.evt as PointerEvent)))
    this.onStart(event.evt as PointerEvent)

    this.fire("drag.start", event)

    window.addEventListener("pointermove", this._handleMove)
    window.addEventListener("pointerup", this._handleUp)
  }

  public subscribe(): void {
    this.on("pointerdown", this._handleDown)
  }

  public unsubscribe(): void {
    this.off("pointerdown", this._handleDown)
  }

  public canDragging(): boolean
  public canDragging(value: boolean): void
  public canDragging(value?: boolean): boolean | void {
    if (isUndefined(value)) return this._canDragging

    if (value) this.subscribe()
    else this.unsubscribe()
  }
}
