import { Polygon, Rectangle } from "./maths"
import { Shape } from "./shapes/Shape"
import { type GetBoundsParams, SimObject } from "./world/sim-object"

export class Group extends SimObject {
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

    return Polygon.prototype.getBounds.call({ points: corners })
  }

  public rotate(angle: number): void {
    super.rotate(angle)

    const matrix = this.computeMatrix()

    this._children.forEach((child) => {
      if (child instanceof Shape) {
        child.worldMatrix = matrix.clone()
      }
    })
  }

  public render(context: CanvasRenderingContext2D): void {
    super.render(context)

    this.drawOrigins(context)

    const bounds = this.getBounds()
    context.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height)
  }
}