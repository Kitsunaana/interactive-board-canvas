import { drawOriginPoint } from "./behaviors/Transformable"
import { Matrix3x3, type PointData, Polygon } from "./maths"
import { PolygonShape } from "./shapes/Polygon"
import { Node, Shape } from "./shapes/Shape"
import { type GetBoundsParams } from "./world/sim-object"

export class Group extends Node {
  public static isGroup(candidate: unknown): candidate is Group {
    return candidate instanceof Group
  }

  public constructor() {
    super()

    this.isShowOrigins = false

    this.on("addChild", (event) => {
      if ("child" in event.evt && event.evt.child instanceof Shape) {
        const child = event.evt.child

        const p = this.computeMatrix()
        const i = Matrix3x3.invert(p) ?? Matrix3x3.identity()
        
        // child.worldMatrix = p
        if (child.includeClassname("test")) {
          const t = Matrix3x3.rotate(0.1)
          // child.worldMatrix = t
        }

        // child._cachedBaseMatrix = i
        // child.worldMatrix = worldMatrix.clone()
        // child.worldMatrix = p
        // child.localMatrix = Matrix3x3.compose(i, child.computeMatrix())
      }
    })
  }

  public updateAfterTransform(): void {
    this._children.forEach((child) => {
      child.worldMatrix = this.computeMatrix()
    })
  }

  public getBounds(params: GetBoundsParams = {}) {
    const points = this.getPointsWithAppliedOwnTransforms()
    if (params.skipTransform) return Polygon.getBounds(points)

    const transformedPoints = points.map(point => this.localMatrix.applyToPoint(point))

    return Polygon.getBounds(transformedPoints)
  }

  private _getUnrotateAndRotateMatrix() {
    const currentAngle = this.getCurrentAngle()
    const currentAngleSign = this.getCurrentAngleSign()
    const rotateOrigin = this.getOriginPosition("rotate")
    const unrotate = Matrix3x3.aroundOrigin(rotateOrigin, () => Matrix3x3.rotate(-currentAngle))
    const rotate = Matrix3x3.aroundOrigin(rotateOrigin, () => Matrix3x3.rotate(currentAngle))

    return [unrotate, rotate]
  }

  public getPointsWithAppliedOwnTransforms(): Array<PointData> {
    const points = this.children().flatMap((child) => {
      if (PolygonShape.isPolygon(child)) return child.getPointsWithAppliedOwnTransforms()
      if (Group.isGroup(child)) return child.getPointsWithAppliedOwnTransforms()
      return []
    })

    return points
  }

  public getUnrotateBounds() {
    const [unrotate] = this._getUnrotateAndRotateMatrix()
    const composed = Matrix3x3.compose(unrotate, this.localMatrix)

    /**
    let allPoints = this.children().flatMap(child => {
      const inverted = Matrix3x3.invert(this.localMatrix) ?? Matrix3x3.identity()
      const matrix = Matrix3x3.compose(inverted, child.localMatrix)

      return child
        .getBounds({ skipTransform: true })
        .getCorners()
        .map(matrix.applyToPoint.bind(matrix))
    })
    */

    const allPoints = this.getPointsWithAppliedOwnTransforms()

    const transformedPoints = allPoints.map(composed.applyToPoint.bind(composed))
    const unrotatedBounds = Polygon.getBounds(transformedPoints)

    return unrotatedBounds;
  }

  public getTransformedCorners() {
    const [_, rotate] = this._getUnrotateAndRotateMatrix()

    const unrotatedBounds = this.getUnrotateBounds()
    const rotatedCorners = unrotatedBounds.getCorners().map(rotate.applyToPoint.bind(rotate))

    return rotatedCorners
  }

  public render(context: CanvasRenderingContext2D): void {
    super.render(context)

    const rotateOrigin = this.getOriginPosition("rotate");
    const scaleOrigin = this.getOriginPosition("scale");

    // const rotateOrigin = {
    //   "x": 205,
    //   "y": 137.5
    // }

    drawOriginPoint(context, rotateOrigin, "rotate")
    drawOriginPoint(context, scaleOrigin, "scale")

    const corners = this.getTransformedCorners()

    context.beginPath()
    PolygonShape.prototype.traceLinearPath.call({ pointsToTrace: corners }, context)
    context.closePath()
    context.stroke()

    const bounds = this.getBounds({ skipTransform: false })
    // context.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height)
  }
}

