import { isNotUndefined } from "../../utils";
import { EventBus, events, type EventName, type Unsubscribe } from "../events/event-bus";
import * as Maths from "../math";
import { getListWithoutItem } from "../utils/list-without-item";

export type PolygonConfig = {
  id?: string
  name?: string
  rotation?: number
  points: Maths.PointData[],
}

export class Polygon extends Maths.Polygon {
  private _bounds = this.getBounds()

  private _events = new EventBus()
  private _interactive = true

  public boundsSkippedRotate: Maths.Rectangle

  public needUpdateBounds: boolean = true
  public angle: number

  constructor(config: PolygonConfig) {
    super(config.points);

    this.angle = config.rotation ?? 0.0
    this.boundsSkippedRotate = this.getBounds()

    const matrix = new Maths.Matrix()
      .setPivot(this.bounds.centerX, this.bounds.centerY)
      .rotate(this.angle)

    this.applyMatrix(matrix)
    this.needUpdateBounds = true
  }

  public get interactive() {
    return this._interactive
  }

  public subscribedEvents = new Set<EventName>()

  public set interactive(value: boolean) {
    this._interactive = value

    this.subscribedEvents.forEach((key) => {
      if (value) events[key].push(this)
      else events[key] = getListWithoutItem(events[key], this)
    })
  }

  public on(key: EventName, callback: Function): Unsubscribe {
    const unsubscribe = this._events.on(key, callback)
    this.subscribedEvents.add(key)

    if (events[key].indexOf(this) === -1)
      events[key].push(this)

    return () => {
      events[key] = getListWithoutItem(events[key], this)
      unsubscribe()
    }
  }

  public emit(key: EventName, cursor: Maths.PointData) {
    this._events.emit(key, cursor)
  }

  public getClientRect(): Maths.Rectangle {
    this._bounds = super.getBounds()

    return this._bounds
  }

  public get bounds() {
    return this.boundsSkippedRotate
  }

  public __debugDrawShape(context: CanvasRenderingContext2D) {
    context.save()
    context.lineWidth = 3
    context.strokeStyle = "#e87123"
    context.beginPath()

    this.points.forEach((point) => context.lineTo(point.x, point.y))

    context.closePath()
    context.stroke()
    context.restore()
  }

  public __debugDrawBounds(context: CanvasRenderingContext2D) {
    const bounds = this.boundsSkippedRotate

    context.save()
    context.lineWidth = 3
    context.strokeStyle = "#000000"
    context.beginPath()
    context.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height)
    context.closePath()
    context.restore()
  }

  public draw(context: CanvasRenderingContext2D, config?: {
    points?: Maths.PointData[]
    angle?: number
  }): void {
    // this.__debugDrawShape(context)
    // this.__debugDrawBounds(context)

    context.save()
    context.beginPath()

    if (isNotUndefined(config)) {
      const points = config.points ?? this.points
      const angle = config.angle ?? 0
      const bounds = this.boundsSkippedRotate

      context.translate(bounds.centerX, this.bounds.centerY)
      context.rotate(angle)

      points.forEach((point) => context.lineTo(point.x - this.bounds.centerX, point.y - this.bounds.centerY))
    } else {
      this.points.forEach((point) => context.lineTo(point.x, point.y))
    }

    context.closePath()
    context.stroke()
    context.restore()
  }
}