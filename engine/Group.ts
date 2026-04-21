import { Transformable } from "./behaviors/Transformable";
import { Container } from "./Container";
import * as Primitive from "./maths";
import { type NodeConfig } from "./Node";
import { Shape } from "./shapes/Shape";

interface GroupConfig extends NodeConfig {
}

export class Group extends Container<Group | Shape> {
  public _needShowOriginPoints = true

  protected readonly _type = "Group" as const

  public readonly transformer = new Transformable(this)

  public constructor(params: GroupConfig) {
    super(params)

    this.transformer.initialize()
  }

  public contains(x: number, y: number): boolean {
    return this.getClientRect().contains(x, y)
  }

  public getPoints(): Array<Primitive.PointData> {
    return this.getChildren().flatMap((child) => child.getPoints())
  }

  public getClientRect(): Primitive.Rectangle {
    const corners = this._children.flatMap((child) => (
      child
        .getClientRect()
        .getCorner()
    ))

    new Primitive.Polygon(corners).getBounds(this._localBounds)

    return this._localBounds
  }

  public add(...children: Array<Group | Shape>): void {
    children.forEach((child) => {
      this._children.push(child)
      child.setParent(this)
    })
  }

  public draw(context: CanvasRenderingContext2D): void {
    context.save()

    this.transformer.bindTransformsToContext(context)

    this._children.forEach((child) => child.draw(context))
    context.restore()

    this.transformer.render(context)
  }

  public drawHit(context: CanvasRenderingContext2D): void {
    context.save()
    this._children.forEach((child) => child.drawHit(context))
    context.restore()
  }
}
