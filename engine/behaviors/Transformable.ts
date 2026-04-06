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

class Origin extends Point {
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
  public readonly origins: Record<OriginVariant, Origin> = {
    rotate: new Origin(),
    scale: new Origin(),
  }

  public abstract getPoints(): Array<PointData>
  public abstract points: Array<PointData>

  public scale = new Point(1, 1)
  public angle = 0

  public get originScale() {
    return this.origins.scale
  }

  public get originRotate() {
    return this.origins.rotate
  }

  public rotatePolygon(angle: number): void {
    this.angle += angle

    this.points.forEach((point) => {
      const next = rotatePointAroundOrigin(point, this.originRotate, angle)

      point.x = next.x
      point.y = next.y
    })

    this.updateOriginScalePosition(angle)
  }

  public scalePolygon(value: PointData): void {
    this.scale.copyFrom(Point.multiple(this.scale, value))

    this.points.forEach((point) => {
      const unrotated = rotatePointAroundOrigin(point, this.originScale, -this.angle)
      const scaled = scalePointAroundOrigin(unrotated, this.originScale, value)
      const rotated = rotatePointAroundOrigin(scaled, this.originScale, this.angle)

      point.x = rotated.x
      point.y = rotated.y
    })

    this.updateOriginRotatePosition(value)
  }

  public setOriginScale(point: PointData, type: OriginVariant): void {
    const points = this.getPoints()

    Polygon.rotate(points, -this.angle, this.origins.rotate)
    const bounds = Polygon.prototype.getBounds.call({ points })

    const base = {
      x: bounds.x + bounds.width * point.x,
      y: bounds.y + bounds.height * point.y,
    }

    const next = rotatePointAroundOrigin(base, this.origins.rotate, this.angle)

    this.origins[type].copyFrom(next)
  }

  public updateOriginScalePosition(angle: number): void {
    const nextOriginScale = rotatePointAroundOrigin(this.origins.scale, this.origins.rotate, angle)
    this.origins.scale.copyFrom(nextOriginScale)
  }

  public updateOriginRotatePosition(value: PointData): void {
    const unrotated = rotatePointAroundOrigin(this.origins.rotate, this.origins.scale, -this.angle)
    const scaled = scalePointAroundOrigin(unrotated, this.origins.scale, value)
    const nextOriginRotate = rotatePointAroundOrigin(scaled, this.origins.scale, this.angle)

    this.origins.rotate.copyFrom(nextOriginRotate)
  }
}