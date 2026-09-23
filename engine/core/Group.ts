import { Matrix3x3, Polygon, Rectangle } from "../maths"
import { Container } from "./Container"
import { routes, type GetBoundsParams, type GetPointsParams } from "./Node"
import { Shape } from "./Shape"

export class Group extends Container {
  public static isGroup(candidate: unknown): candidate is Group {
    return candidate instanceof Group
  }

  public type: string = "Group"

  public constructor() {
    super()

    this.emitter.on(routes.addChild, ({ payload }) => {
      const child = payload.child

      child.transform.__testMatrix = Matrix3x3.invert(this.transform.worldMatrix) ?? Matrix3x3.identity()
      child.updateWorldTransform()
    })
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
    return this.children.flatMap(child => {
      if (Shape.isShape(child)) return child
      return this.getFlatListChildren.call(child)
    })
  }

  public getPoints(params: GetPointsParams = {}) {
    return this.children.flatMap((child) => child.getPoints(params))
  }

  public getUnrotateBounds(): Rectangle {
    const currentAngle = Math.atan2(this.transform.worldMatrix.b, this.transform.worldMatrix.a)
    const unrotate = Matrix3x3.aroundOrigin(this.transform.getInLocalOriginPosition("rotate"), () => {
      return Matrix3x3.rotate(-currentAngle)
    })

    const points = this.getFlatListChildren().flatMap((shape) => {
      const matrix = Matrix3x3.compose(unrotate, shape.worldMatrix)

      return shape
        .getPoints()
        .map((point) => matrix.applyToPoint(point))
    })

    return Polygon.getBounds(points)
  }

  private _getMatrixToChildForComputeBounds(params: GetBoundsParams, child: Shape): Matrix3x3 {
    if (params.skipTransform) {
      const invertParent = Matrix3x3.invert(this.transform.localMatrix) ?? Matrix3x3.identity()

      return child.parent === this
        ? Matrix3x3.compose(child.transform.__testMatrix, child.localMatrix)
        : Matrix3x3.compose(invertParent, child.worldMatrix)
    }

    return child.worldMatrix
  }
}

