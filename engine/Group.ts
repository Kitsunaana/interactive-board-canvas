import { Matrix3x3, Polygon, Rectangle } from "./maths"
import { Node, Shape } from "./shapes/Shape"
import { type GetBoundsParams } from "./world/sim-object"

export class Group extends Node {
  public static isGroup(candidate: unknown): candidate is Group {
    return candidate instanceof Group
  }

  public constructor() {
    super()

    this.isShowOrigins = true
  }

  public getBounds(params: GetBoundsParams = {}): Rectangle {
    const corners = this._children.flatMap((child) => child
      .getBounds({
        skipWorldTransform: params.skipTransform,
        skipTransform: false,
      })
      .getCorners()
    )

    return Polygon.getBounds(corners)
  }

  public updateAfterTransform(): void {
    const matrix = Matrix3x3.compose(this._worldMatrix, this._localMatrix)

    this._children.forEach((child) => {
      if (Shape.isShape(child) || Group.isGroup(child)) {
        child.worldMatrix = matrix.clone()
      }
    })
  }

  public render(context: CanvasRenderingContext2D): void {
    super.render(context)

    this.drawOrigins(context)

    const bounds = this.getBounds()
    // context.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height)
  }
}