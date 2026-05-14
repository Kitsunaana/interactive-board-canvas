import { Container } from "./Container";
import { type PointData, Matrix3x3, Point, Polygon, Rectangle } from "./maths";
import { type NodeConfig } from "./Node";
import { Shape } from "./shapes/Shape";

interface GroupConfig extends NodeConfig {
}

export class Group extends Container<Group | Shape> {
  protected readonly _type = "Group" as const

  public constructor(params: GroupConfig) {
    super(params)
  }

  public contains(x: number, y: number): boolean {
    return this.getBounds().contains(x, y)
  }

  public getPoints(): Array<PointData> {
    return this
      .getChildren()
      .flatMap((child) => {
        const matrix = child.computeMatrix()

        return child
          .getBounds()
          .getCorner()
          .map((point) => matrix.applyToPoint(point))
      })
  }

  public getBounds(): Rectangle {
    const bounds = Polygon.prototype.getBounds.call({ points: this.getPoints() })
    return bounds
  }

  public add(...children: Array<Group | Shape>): void {
    const instructions = this.getInvertInstructions()

    children.forEach((child) => {
      this._children.push(child)

      child.setParent(this)
      child.setInstructions(instructions)
    })
  }

  public render(context: CanvasRenderingContext2D): void {
    context.save()
    this.bindTransformsToContext(context)
    this._children.forEach((child) => child.render(context))
    context.restore()

    this.drawOrigins(context)
    this.renderBoundingBox(context)
  }

  public renderBoundingBox(context: CanvasRenderingContext2D) {
    const matrix = this.computeMatrix()
    const bounds = this.getBounds()

    context.save()
    matrix.applyToContext(context)
    context.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height)
    context.restore()
  }

  public renderHit(context: CanvasRenderingContext2D): void {
    context.save()
    this.bindTransformsToContext(context)
    this._children.forEach((child) => child.renderHit(context))
    context.restore()
  }
}
