import { Mixin } from "ts-mixer";
import { Transformable, drawOriginPoint } from "./behaviors/Transformable";
import * as Primitive from "./maths";
import { Node, type NodeConfig } from "./Node";
import { Shape } from "./shapes/Shape";

interface GroupConfig extends NodeConfig {
}

export class Group extends Mixin(Node, Transformable) {
  protected readonly _type = "Group"

  private _children: Array<Shape | Group> = []

  private readonly _localBounds: Primitive.Rectangle = new Primitive.Rectangle()

  public get absolutePositionCursor(): Primitive.PointData {
    return this.getParent()!.absolutePositionCursor
  }

  public getType(): string {
    return this._type
  }

  public getChildren(): Array<Shape | Group> {
    return this._children
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

      this.setOriginScale({ x: 0.5, y: 0.5 }, "rotate")
      this.setOriginScale({ x: 0.0, y: 0.5 }, "scale")

      child.setParent(this)
    })
  }

  public rotatePolygon(angle: number): void {
    this.getChildren().forEach((child) => {
      child.originRotate.push()
      child.originRotate.copyFrom(this.originRotate)
      child.rotatePolygon(angle)
      child.originRotate.pop()
    })

    this.updateOriginScalePosition(angle)
  }

  public scalePolygon(value: Primitive.PointData): void {
    this.getChildren().forEach((child) => {
      child.originScale.push()
      child.originScale.copyFrom(this.originScale)
      child.scalePolygon(value)
      child.originScale.pop()
    })

    this.updateOriginRotatePosition(value)
  }

  public draw(context: CanvasRenderingContext2D): void {
    const position = this.getPosition()

    context.save()
    context.translate(position.x, position.y)
    this._children.forEach((child) => child.draw(context))
    context.restore()

    drawOriginPoint(context, this.originRotate, "rotate")
    drawOriginPoint(context, this.originScale, "scale")
  }
}