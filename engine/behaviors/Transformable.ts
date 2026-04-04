import {type PointData, Point, Polygon, scalePointAroundOrigin, rotatePointAroundOrigin} from "../maths"

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

export abstract class Transformable {
  public readonly origins: Record<OriginVariant, Point> = {
    rotate: new Point(),
    scale: new Point(),
  }

  public abstract getAngle(): number
  public abstract getPoints(): Array<PointData>

  public abstract rotate(angle: number): void
  public abstract scale(value: PointData): void

  public setOriginScale(point: PointData, type: OriginVariant): void {
    const points = this.getPoints()
    const angle = this.getAngle()

    Polygon.rotate(points, -angle, this.origins.rotate)
    const bounds = Polygon.prototype.getBounds.call({ points })

    const base = {
      x: bounds.x + bounds.width * point.x,
      y: bounds.y + bounds.height * point.y,
    }

    const next = rotatePointAroundOrigin(base, this.origins.rotate, angle)

    this.origins[type].copyFrom(next)
  }

  public updateOriginScalePosition(angle: number): void {
    const nextOriginScale = rotatePointAroundOrigin(this.origins.scale, this.origins.rotate, angle)
    this.origins.scale.copyFrom(nextOriginScale)
  }

  public updateOriginRotatePosition(value: PointData): void {
    const angle = this.getAngle()

    const unrotated = rotatePointAroundOrigin(this.origins.rotate, this.origins.scale, -angle)
    const scaled = scalePointAroundOrigin(unrotated, this.origins.scale, value)
    const nextOriginRotate = rotatePointAroundOrigin(scaled, this.origins.scale, angle)

    this.origins.rotate.copyFrom(nextOriginRotate)
  }
}