import { Mixin } from "ts-mixer";
import { Transformable, drawOriginPoint } from "./behaviors/Transformable";
import * as Primitive from "./maths";
import { Node, type NodeConfig } from "./Node";
import { Shape } from "./shapes/Shape";
import { Container } from "./Container";

interface GroupConfig extends NodeConfig {
}

export class Group extends Container<Group | Shape> {
  public _needShowOriginPoints = true

  protected readonly _type = "Group" as const

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

      this.recalculateOriginPoint("rotate")
      this.recalculateOriginPoint("scale")

      child.setParent(this)
    })
  }

  public rotatePolygon(angle: number): void {
    this.getChildren().forEach((child) => {
      child.absOriginRotate.push()
      child.absOriginRotate.copyFrom(this.absOriginRotate)
      child.rotatePolygon(angle)
      child.absOriginRotate.pop()
      child.recalculateOriginPoint("rotate")
    })

    this.getAllParents().forEach((parent) => {
      parent.recalculateOriginPoint("rotate")
      parent.recalculateOriginPoint("scale")
    })

    this.updateOriginScalePosition(angle)
    this.accumulateRotate(angle)
  }

  public scalePolygon(value: Primitive.PointData): void {
    this.getChildren().forEach((child) => {
      child.absOriginScale.push()
      child.absOriginScale.copyFrom(this.absOriginScale)
      child.scalePolygon(value)
      child.absOriginScale.pop()
      child.recalculateOriginPoint("scale")
    })

    this.getAllParents().forEach((parent) => {
      parent.recalculateOriginPoint("rotate")
      parent.recalculateOriginPoint("scale")
    })

    this.updateOriginRotatePosition(value)
    this.accumulateScale(value)
  }

  public draw(context: CanvasRenderingContext2D): void {
    const position = this.getPosition()

    context.save()
    context.translate(position.x, position.y)
    this._children.forEach((child) => child.draw(context))
    context.restore()

    if (this._needShowOriginPoints) {
      drawOriginPoint(context, this.absOriginRotate, "rotate")
      drawOriginPoint(context, this.absOriginScale, "scale")
    }
  }
}