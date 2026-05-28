import { BaseShapeComponent } from "../components/base-shape-component"
import { Point, type PointData } from "../maths"

export abstract class BaseGradient {
  public abstract computeGradient(context: CanvasRenderingContext2D): CanvasGradient

  public colorStops: Array<[number, string]> = []

  private _dirty: boolean = true
  private _gradient: CanvasGradient | null = null
  private _component: BaseShapeComponent | null = null

  public get component() {
    if (this._component === null) throw new Error("Компонента не определена")
    return this._component
  }

  public setColorStops(stops: Array<number | string>): this {
    if (stops.length % 2 === 1) return this

    const parsedStops: Array<[number, string]> = []

    for (let i = 0; i < stops.length; i += 2) {
      const offset = parseFloat(String(stops[i]))
      const color = String(stops[i + 1])

      if (typeof offset === "number" && typeof color === "string") {
        parsedStops.push([offset, color])
      }
    }

    this.colorStops = parsedStops
    return this
  }

  public getGradient(context: CanvasRenderingContext2D): CanvasGradient {
    if (this._dirty === false || this._gradient === null) {
      this._gradient = this.computeGradient(context)
      this._dirty = true
    }

    return this._gradient
  }

  public applyColorStops(gradient: CanvasGradient): void {
    this.colorStops.forEach((stop) => gradient.addColorStop(...stop))
  }

  public setComponent(component: BaseShapeComponent): this {
    this._component = component
    return this
  }

  public markDirty() {
    this._dirty = false
  }
}

export class ConicGradient extends BaseGradient {
  private _point: Point = new Point(0, 0)
  private _angle: number = 0

  public setPoint(point: PointData): this {
    this._point.copyFrom(point)
    this.markDirty()
    return this
  }

  public setAngle(angle: number): this {
    this._angle = angle
    this.markDirty()
    return this
  }

  public computeGradient(context: CanvasRenderingContext2D): CanvasGradient {
    const gradient = context.createConicGradient(this._angle, ...this._point.array())
    this.applyColorStops(gradient)
    return gradient
  }
}

export class LinearGradient extends BaseGradient {
  private _startPoint: Point = new Point(0, 0)
  private _endPoint: Point = new Point(0, 0)

  public setStartPoint(point: PointData): this {
    this._startPoint.copyFrom(this.component.getBounds().center.add(point))
    this.markDirty()
    return this
  }

  public setEndPoint(point: PointData): this {
    this._endPoint.copyFrom(this.component.getBounds().center.add(point))
    this.markDirty()
    return this
  }

  public computeGradient(context: CanvasRenderingContext2D): CanvasGradient {
    const gradient = context.createLinearGradient(
      ...this._startPoint.array(),
      ...this._endPoint.array(),
    )

    this.applyColorStops(gradient)

    return gradient
  }
}

export class RadialGradient extends BaseGradient {
  private _startPoint: Point = new Point(0, 0)
  private _endPoint: Point = new Point(0, 0)
  private _startRadius: number = 0
  private _endRadius: number = 0

  public get startPoint(): Point {
    return this._startPoint
  }

  public get endPoint(): Point {
    return this._endPoint
  }

  public get startRadius(): number {
    return this._startRadius
  }

  public get endRadius(): number {
    return this._endRadius
  }

  public setStartPoint(point: PointData): this {
    this._startPoint.copyFrom(this.component.getBounds().center.add(point))
    this.markDirty()
    return this
  }

  public setEndPoint(point: PointData): this {
    this._endPoint.copyFrom(this.component.getBounds().center.add(point))
    this.markDirty()
    return this
  }

  public setStartRadius(radius: number): this {
    this._startRadius = radius
    this.markDirty()
    return this
  }

  public setEndRadius(radius: number): this {
    this._endRadius = radius
    this.markDirty()
    return this
  }

  public computeGradient(context: CanvasRenderingContext2D): CanvasGradient {
    const gradient = context.createRadialGradient(
      this._startPoint.x,
      this._startPoint.y,
      this._startRadius,
      this._endPoint.x,
      this._endPoint.y,
      this._endRadius
    )

    this.applyColorStops(gradient)

    return gradient
  }
}
