import { drawOriginPoint } from "./behaviors/Transformable"
import { Matrix3x3, Polygon, Rectangle } from "./maths"
import { PolygonShape } from "./shapes/Polygon"
import { Shape } from "./shapes/Shape"
import { SimObject, type GetBoundsParams } from "./world/sim-object"

export class Group extends SimObject {
  public static isGroup(candidate: unknown): candidate is Group {
    return candidate instanceof Group
  }

  public isDrawOriginPosition: boolean = false
  public isDrawCorners: boolean = false
  public isDrawBounds: boolean = false

  public constructor() {
    super()
  }

  public updateAfterTransform(): void { }

  public getBounds(params: GetBoundsParams = {}): Rectangle {
    const points = this
      .getFlatListChildren()
      .flatMap((child) => {
        const matrix = this._getMatrixToChildForComputeBounds(params, child)

        return child
          .getPoints()
          .map(matrix.applyToPoint.bind(matrix))

      })

    return Polygon.getBounds(points)
  }

  public getFlatListChildren(): Array<Shape> {
    const children = this.children()

    return children.flatMap(child => {
      if (Shape.isShape(child)) return child
      return this.getFlatListChildren.call(child)
    })
  }

  public getUnrotateBounds(): Rectangle {
    const unrotate = Matrix3x3.aroundOrigin(this.getInLocalOriginPosition("rotate"), () => {
      return Matrix3x3.rotate(-this.getCurrentAngle())
    })

    const points = this.getFlatListChildren().flatMap((shape) => {
      const matrix = Matrix3x3.compose(unrotate, shape.worldMatrix)
      return shape._initialPoints.map((point) => matrix.applyToPoint(point))
    })

    return Polygon.getBounds(points)
  }

  public render(context: CanvasRenderingContext2D): void {
    super.render(context)

    if (this.isDrawOriginPosition) this._drawOriginPositions(context)
    if (this.isDrawCorners) this._drawCorners(context)
    if (this.isDrawBounds) this._drawBounds(context)
  }

  private _getMatrixToChildForComputeBounds(params: GetBoundsParams, child: Shape): Matrix3x3 {
    if (params.skipTransform) {
      const invertParent = Matrix3x3.invert(this.localMatrix) ?? Matrix3x3.identity()

      return child.parent() === this
        ? child.localMatrix
        : Matrix3x3.compose(invertParent, child.worldMatrix)
    }

    return child.worldMatrix
  }

  private _drawCorners(context: CanvasRenderingContext2D): void {
    const corners = this.getTransformedCorners()

    context.beginPath()
    PolygonShape.prototype._traceLinearPath.call({ _pointsToTrace: corners }, context)
    context.closePath()
    context.stroke()
  }

  private _drawBounds(context: CanvasRenderingContext2D): void {
    const bounds = this.getBounds({ skipTransform: false })
    context.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height)
  }

  private _drawOriginPositions(context: CanvasRenderingContext2D): void {
    const scaleOrigin = this.getInWorldOriginPoisition("scale")
    const rotateOrigin = this.getInWorldOriginPoisition("rotate")

    drawOriginPoint(context, rotateOrigin, "rotate")
    drawOriginPoint(context, scaleOrigin, "scale")
  }
}

