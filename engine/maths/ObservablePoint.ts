import type { PointData, PointLike } from "./Point"

export interface Observer<T> {
  _onUpdate: (point?: T) => void
}

export class ObservablePoint {
  private _x: number
  private _y: number

  private readonly _observer: Observer<ObservablePoint>

  constructor(observer: Observer<ObservablePoint>, x?: number, y?: number) {
    this._x = x || 0
    this._y = y || 0

    this._observer = observer
  }

  public clone(observer?: Observer<ObservablePoint>): ObservablePoint {
    return new ObservablePoint(observer ?? this._observer, this._x, this._y)
  }

  public set(x = 0, y = x): this {
    if (this._x !== x || this._y !== y) {
      this._x = x
      this._y = y
      this._observer._onUpdate(this)
    }

    return this
  }

  public copyFrom(point: PointData): this {
    if (this._x !== point.x || this._y !== point.y) {
      this._x = point.x
      this._y = point.y
      this._observer._onUpdate(this)
    }

    return this
  }

  public copyTo<T extends PointLike>(point: T): T {
    point.set(this._x, this._y)

    return point
  }

  public equals(point: PointData): boolean {
    return (point.x === this._x) && (point.y === this._y)
  }

  get x(): number {
    return this._x
  }

  set x(value: number) {
    if (this._x !== value) {
      this._x = value
      this._observer._onUpdate(this)
    }
  }

  get y(): number {
    return this._y
  }

  set y(value: number) {
    if (this._y !== value) {
      this._y = value
      this._observer._onUpdate(this)
    }
  }
}
