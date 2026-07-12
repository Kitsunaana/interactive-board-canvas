import { Matrix3x3, type PointData, Polygon, Rectangle } from "./maths"
import { Node, Shape } from "./shapes/Shape"
import { SimObject, type GetBoundsParams } from "./world/sim-object"

export class Group extends Node {
  public static isGroup(candidate: unknown): candidate is Group {
    return candidate instanceof Group
  }

  public constructor() {
    super()

    this.isShowOrigins = false
  }

  private _getRecursiveTransformedPoints(container: SimObject): Array<PointData> {
    const children = container.children()

    return children.flatMap((child) => {
      if (Shape.isShape(child)) {
        return child.initialPoints
        // return child.initialPoints.map((point) => child.localMatrix.applyToPoint(point))
      }

      return this._getRecursiveTransformedPoints(child)
    })

  }

  public getUnrotateGroupBounds() {
    const matrix = this.computeMatrix()
    const currentAngle = this.getCurrentAngle()
    const unrotate = Matrix3x3.aroundOrigin(this.getOriginPosition("rotate"), () => {
      return Matrix3x3.rotate(-currentAngle)
    })

    const merged = Matrix3x3.compose(unrotate, matrix)

    const allModifiedPoints = this._getRecursiveTransformedPoints(this)
    const unrotateAllPoints = allModifiedPoints.map(merged.applyToPoint.bind(merged))

    return Polygon.getBounds(unrotateAllPoints)
  }

  public getFlatListShapes(node: SimObject): Array<Shape> {
    return node.children().flatMap((child) => {
      if (Group.isGroup(child)) return this.getFlatListShapes(child)

      return child as Shape
    })
  }

  public getBounds(params: GetBoundsParams = {}): Rectangle {
    const corners = this._children.flatMap((child) => child
      .getBounds({
        skipWorldTransform: params.skipTransform,
        skipTransform: false,
      })
      .getCorners()
    )

    const allSpapes = this.getFlatListShapes(this)

    const points = allSpapes.flatMap((shape) => {
      const needApplyTransforms = !((shape.parent() === this) && (params.skipTransform || params.skipWorldTransform))
      const matrix = needApplyTransforms ? Matrix3x3.compose(shape.worldMatrix, shape.localMatrix) : shape.localMatrix

      return shape.initialPoints.map(matrix.applyToPoint.bind(matrix))
    })

    return Polygon.getBounds(points)

    return Polygon.getBounds(corners)
  }

  public updateAfterTransform(): void {
    const matrix = Matrix3x3.compose(this.worldMatrix, this.localMatrix)

    this._children.forEach((child) => {
      if (Shape.isShape(child) || Group.isGroup(child)) {
        child.worldMatrix = matrix.clone()
      }
    })
  }

  public render(context: CanvasRenderingContext2D): void {
    super.render(context)

    // this.drawOrigins(context)

    const bounds = this.getBounds()
    // context.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height)
  }
}

