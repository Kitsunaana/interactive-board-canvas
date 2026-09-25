import { Matrix3x3, Polygon, Rectangle } from "../maths"
import { CircleShape } from "../shapes/Circle"
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

  public render(context: CanvasRenderingContext2D): void {
    context.save()
    this.cachedMatrix.applyToContext(context)
    super.render(context)
    context.restore()

    if (this.hasName("@@_SYSTEM_UI")) return

    context.betweenSaveAndRestore(() => {
      this.cachedMatrix.applyToContext(context)

      const corners = this
        .getBounds({ skipTransform: true })
        .getCorners()
        .map((p) => this.worldMatrix.applyToPoint(p))

      context.beginPath()
      context.moveTo(corners[0].x, corners[0].y)
      corners.forEach((p) => context.lineTo(p.x, p.y))
      context.closePath()
      context.stroke()
    })

  }

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
      const invertParent = Matrix3x3.invert(this.localMatrix) ?? Matrix3x3.identity()

      return child.parent === this
        ? Matrix3x3.compose(child.transform.__testMatrix, child.localMatrix)
        : Matrix3x3.compose(invertParent, child.worldMatrix)
    }

    return child.worldMatrix
  }
}

