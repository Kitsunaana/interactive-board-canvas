import { drawOriginPoint } from "./behaviors/Transformable"
import { Matrix3x3, type PointData, Polygon, Rectangle } from "./maths"
import { PolygonShape } from "./shapes/Polygon"
import { Node } from "./shapes/Shape"
import { type GetBoundsParams } from "./world/sim-object"

export class Group extends Node {
  public static isGroup(candidate: unknown): candidate is Group {
    return candidate instanceof Group
  }

  public updateAfterTransform(): void {}

  public getBounds(params: GetBoundsParams = {}): Rectangle {
    const points = this.getPointsWithAppliedOwnTransforms()
    if (params.skipTransform) return Polygon.getBounds(points)
    const transformedPoints = points.map(point => this.worldMatrix.applyToPoint(point))
    return Polygon.getBounds(transformedPoints)
  }

  public getPointsWithAppliedOwnTransforms(): Array<PointData> {
    const points = this.children().flatMap((child) => {
      if (PolygonShape.isPolygon(child)) return child.getPointsWithAppliedOwnTransforms()
      if (Group.isGroup(child)) return child.getPointsWithAppliedOwnTransforms()
      return []
    })

    return points
  }

  public getUnrotateBounds(): Rectangle {
    const [unrotate] = this._getUnrotateAndRotateMatrix()
    const composed = Matrix3x3.compose(unrotate, this.localMatrix)

    const allPoints = this.getPointsWithAppliedOwnTransforms()

    const transformedPoints = allPoints.map(composed.applyToPoint.bind(composed))
    const unrotatedBounds = Polygon.getBounds(transformedPoints)

    return unrotatedBounds;
  }

  public getTransformedCorners(): Array<PointData> {
    const [_, rotate] = this._getUnrotateAndRotateMatrix()

    const unrotatedBounds = this.getUnrotateBounds()
    const rotatedCorners = unrotatedBounds.getCorners().map(rotate.applyToPoint.bind(rotate))

    return rotatedCorners
  }

  public render(context: CanvasRenderingContext2D): void {
    super.render(context)

    const scaleOrigin = this.getInWorldOriginPoisition("scale")
    const rotateOrigin = this.getInWorldOriginPoisition("rotate")

    drawOriginPoint(context, rotateOrigin, "rotate")
    drawOriginPoint(context, scaleOrigin, "scale")

    const corners = this.getTransformedCorners()

    context.beginPath()
    PolygonShape.prototype.traceLinearPath.call({ pointsToTrace: corners }, context)
    context.closePath()
    context.stroke()

    const bounds = this.getBounds({ skipTransform: false })
    context.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height)
  }

  private _getUnrotateAndRotateMatrix(): [Matrix3x3, Matrix3x3] {
    const currentAngle = Math.atan2(this.worldMatrix.b, this.worldMatrix.a)

    const rotateOrigin = this.getInLocalOriginPosition("rotate")
    const unrotate = Matrix3x3.aroundOrigin(rotateOrigin, () => Matrix3x3.rotate(-currentAngle))
    const rotate = Matrix3x3.aroundOrigin(rotateOrigin, () => Matrix3x3.rotate(currentAngle))

    return [unrotate, rotate]
  }
}

