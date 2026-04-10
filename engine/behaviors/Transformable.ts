import { type PointData, Point, Polygon, scalePointAroundOrigin, rotatePointAroundOrigin } from "../maths"

export function drawOriginPoint(context: CanvasRenderingContext2D, point: PointData, caption: string) {
  context.save()
  context.beginPath()
  context.arc(point.x, point.y, 5, 0, Math.PI * 2, false)
  context.textAlign = "center"
  context.textBaseline = "bottom"
  context.font = "14px Arial"
  context.fillText(caption, point.x, point.y - 5)
  context.stroke()
  context.fill()
  context.restore()
}

type OriginVariant = "rotate" | "scale"

class OriginPoint extends Point {
  private _saved: PointData | null = null

  public push(): void {
    this._saved = {
      x: this.x,
      y: this.y,
    }
  }

  public pop(): void {
    if (this._saved !== null) {
      this.copyFrom(this._saved)
    }
  }
}

export abstract class Transformable {
  public abstract getPoints(): Array<PointData>
  public abstract points: Array<PointData>

  public readonly absoluteOrigins: Record<OriginVariant, OriginPoint> = {
    rotate: new OriginPoint(),
    scale: new OriginPoint(),
  }

  public readonly relativeOrigins: Record<OriginVariant, OriginPoint> = {
    rotate: new OriginPoint(),
    scale: new OriginPoint(),
  }

  public scale = new Point(1, 1)
  public angle = 0

  public get absOriginScale(): OriginPoint {
    return this.absoluteOrigins.scale
  }

  public get absOriginRotate(): OriginPoint {
    return this.absoluteOrigins.rotate
  }

  public rotatePolygon(angle: number): void {
    this.accumulateRotate(angle)

    this.points.forEach((point) => {
      const next = rotatePointAroundOrigin(point, this.absOriginRotate, angle)

      point.x = next.x
      point.y = next.y
    })

    this.updateOriginScalePosition(angle)
  }

  public scalePolygon(value: PointData): void {
    this.accumulateScale(value)

    const angle = this.angle

    this.points.forEach((point) => {
      const unrotated = rotatePointAroundOrigin(point, this.absOriginScale, -angle)
      const scaled = scalePointAroundOrigin(unrotated, this.absOriginScale, value)
      const rotated = rotatePointAroundOrigin(scaled, this.absOriginScale, angle)

      point.x = rotated.x
      point.y = rotated.y
    })

    this.updateOriginRotatePosition(value)
  }

  public setOriginPoint(type: OriginVariant, point: PointData) {
    this.relativeOrigins[type].copyFrom(point)
    this.recalculateOriginPoint(type)
  }

  public recalculateOriginPoint(type: OriginVariant): void {
    const points = this.getPoints()
    const point = this.relativeOrigins[type]

    Polygon.rotate(points, -this.angle, this.absoluteOrigins.rotate)
    const bounds = Polygon.prototype.getBounds.call({ points })

    const base = {
      x: bounds.x + bounds.width * point.x,
      y: bounds.y + bounds.height * point.y,
    }

    const next = rotatePointAroundOrigin(base, this.absoluteOrigins.rotate, this.angle)

    this.absoluteOrigins[type].copyFrom(next)
  }

  public updateOriginScalePosition(angle: number): void {
    const nextOriginScale = rotatePointAroundOrigin(this.absoluteOrigins.scale, this.absoluteOrigins.rotate, angle)
    this.absoluteOrigins.scale.copyFrom(nextOriginScale)
  }

  public updateOriginRotatePosition(value: PointData): void {
    const unrotated = rotatePointAroundOrigin(this.absoluteOrigins.rotate, this.absoluteOrigins.scale, -this.angle)
    const scaled = scalePointAroundOrigin(unrotated, this.absoluteOrigins.scale, value)
    const nextOriginRotate = rotatePointAroundOrigin(scaled, this.absoluteOrigins.scale, this.angle)

    this.absoluteOrigins.rotate.copyFrom(nextOriginRotate)
  }

  public accumulateRotate(angle: number): void {
    this.angle += angle
  }

  public accumulateScale(scale: PointData): void {
    this.scale.copyFrom(Point.multiple(scale, this.scale))
  }
}