import { ShapeTransformerPreviewState } from "./behaviors/transformer/shape/_preview";
import { Container } from "./Container";
import * as Primitive from "./maths";
import { type NodeConfig } from "./Node";
import { Shape } from "./shapes/Shape";

interface GroupConfig extends NodeConfig {
}

export class Group extends Container<Group | Shape> {
  public _needShowOriginPoints = true

  protected readonly _type = "Group" as const

  public readonly transformer = new ShapeTransformerPreviewState(this)

  public constructor(params: GroupConfig) {
    super(params)

    this.transformer.initialize()
  }

  public get absolutePositionCursor(): Primitive.PointData {
    return this.getParent()!.absolutePositionCursor
  }

  public getType(): string {
    return this._type
  }

  public getChildren(): Array<Shape | Group> {
    return super.getChildren()
  }

  public contains(x: number, y: number): boolean {
    this.getClientRect()

    return this._localBounds.contains(x, y)
  }

  public getPoints(): Array<Primitive.PointData> {
    return this.getChildren().flatMap((child) => {
      return child.getPoints()
    })
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
    const position = this.getPosition()

    context.save()
    context.translate(position.x, position.y)

    this.transformer.bindTransformsToContext(context)

    this._children.forEach((child) => child.draw(context))
    context.restore()

    this.transformer.render(context)
  }

  public drawHit(context: CanvasRenderingContext2D): void {
    const position = this.getPosition()

    context.save()
    context.translate(position.x, position.y)
    this._children.forEach((child) => child.drawHit(context))
    context.restore()
  }
}
