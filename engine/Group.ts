import { Mixin } from "ts-mixer";
import * as Primitive from "./maths";
import { Node, type NodeConfig } from "./Node";
import { Polygon } from "./shapes";
import { Transformable, drawOriginPoint } from "./behaviors/Transformable"

interface GroupConfig extends NodeConfig {
}

export class Group extends Mixin(Node, Transformable) {
  protected readonly _type = "Group"

  private _children: Array<Node> = []

  private readonly _localBounds: Primitive.Rectangle = new Primitive.Rectangle()

  private readonly _absolutePositionCursor: Primitive.PointData = {
    x: 0,
    y: 0,
  }

  public get absolutePositionCursor() {
    return this.getParent()?.absolutePositionCursor ?? this._absolutePositionCursor
  }

  public getType() {
    return this._type
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

  public add(...children: Array<Node>) {
    children.forEach((child) => {
      this._children.push(child)

      this.setOriginScale({ x: 0.5, y: 0.5 }, "rotate")
      this.setOriginScale({ x: 0.5, y: 0.5 }, "scale")

      child.setParent(this)
    })
  }

  public getChildren() {
    return this._children
  }

  public rotate(angle: number) {
    this.setAngle(this.getAngle() + angle)

    this.getChildren().forEach((child) => {
      if (child instanceof Polygon) {
        const prevOriginRotate = child.origins.rotate.clone()

        child.origins.rotate.copyFrom(this.origins.rotate)
        child.rotate(angle)
        child.origins.rotate.copyFrom(prevOriginRotate)
      }
    })

    this.updateOriginScalePosition(angle)
  }

  public scale(value: Primitive.PointData) {
    this.setScale(Primitive.Point.multiple(value, this.getScale()))

    this.getChildren().forEach((child) => {
      if (child instanceof Polygon) {
        console.log(child)
        const prevOriginScale = child.origins.scale.clone()

        child.origins.scale.copyFrom(this.origins.scale)
        child.scale(value)
        child.origins.scale.copyFrom(prevOriginScale)
      }
    })

    this.updateOriginRotatePosition(value)
  }

  public draw(context: CanvasRenderingContext2D): void {
    const position = this.getPosition()

    context.save()
    context.translate(position.x, position.y)
    this._children.forEach((child) => child.draw(context))
    context.restore()

    drawOriginPoint(context, this.origins.rotate, "rotate")
    drawOriginPoint(context, this.origins.scale, "scale")
  }
}