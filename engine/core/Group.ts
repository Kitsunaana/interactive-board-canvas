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
      // const child = payload.child

      // child.transform.__testMatrix = Matrix3x3.invert(this.transform.worldMatrix) ?? Matrix3x3.identity()
      // child.updateWorldTransform()
    })
  }

  public updateAfterTransform(): void { }

  public render(context: CanvasRenderingContext2D): void {
    context.betweenSaveAndRestore(() => {
      this.cachedMatrix.applyToContext(context)
      super.render(context)
    })

    if (this.hasName("@@_SYSTEM_UI")) return

    context.betweenSaveAndRestore(() => {
      this.cachedMatrix.applyToContext(context)

      const corners = this
        .getBounds({ skipTransform: true })
        // .padding(7)
        .getCorners()
        .map((p) => this.worldMatrix.applyToPoint(p))

      context.strokeStyle = "#2980e6"
      context.beginPath()
      context.moveTo(corners[0].x, corners[0].y)
      corners.forEach((p) => context.lineTo(p.x, p.y))
      context.closePath()
      // context.stroke()
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
    const basis = this.transform.worldMatrix.getResizeBasis()
    const inverse = Matrix3x3.invert(basis) ?? Matrix3x3.identity()

    const untransform = Matrix3x3.aroundOrigin(this.transform.getInLocalOriginPosition("rotate"), () => inverse)

    const points = this.getFlatListChildren().flatMap((shape) => {
      const matrix = Matrix3x3.compose(untransform, shape.worldMatrix)
      return shape.getPoints().map((point) => matrix.applyToPoint(point));
    })

    return Polygon.getBounds(points);
  }

  private _getMatrixToChildForComputeBounds(params: GetBoundsParams, child: Shape): Matrix3x3 {
    if (params.skipTransform) {
      const invertParent = Matrix3x3.invert(this.localMatrix) ?? Matrix3x3.identity()

      return child.parent === this
        ? Matrix3x3.compose(child.localMatrix)
        : Matrix3x3.compose(invertParent, child.worldMatrix)
    }

    return child.worldMatrix
  }
}

