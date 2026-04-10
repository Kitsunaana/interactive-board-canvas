import { isNull } from "lodash";
import { Container } from "./Container";
import * as Primitive from "./maths";
import { Node, type NodeConfig } from "./Node";
import { type Sizes, Stage } from "./Stage";
import { Mixin } from "ts-mixer";
import { Transformable } from "./behaviors/Transformable";

export interface LayerConfig extends NodeConfig {
}

export class Layer extends Mixin(Container, Transformable) {
  protected readonly _type = "Layer"

  private _stage: Stage | null = null

  private readonly _canvas: HTMLCanvasElement
  private readonly _context: CanvasRenderingContext2D

  public get absolutePositionCursor() {
    if (isNull(this._stage)) throw new Error("Слой должен быть добавлен в Stage")
    return this._stage.absolutePositionCursor
  }

  public constructor(config: LayerConfig) {
    super(config)

    this._canvas = document.createElement("canvas")
    this._context = this._canvas.getContext("2d") as CanvasRenderingContext2D
  }

  public getStage(): Stage | null {
    return this._stage
  }
  
  public setStage(parent: Stage) {
    this._stage = parent
    this.setSizes(parent.sizes)
  }

  public setSizes(sizes: Sizes) {
    this._canvas.width = sizes.width
    this._canvas.height = sizes.height
  }

  public getSizes(): Sizes {
    return {
      width: this._canvas.width,
      height: this._canvas.height,
    }
  }

  public getParent(): Node | null {
    return this._stage
  }

  public getCanvas() {
    return this._canvas
  }

  public getContext() {
    return this._context
  }

  public getType(): string {
    return this._type
  }

  public getPoints(): Array<Primitive.PointData> {
    return []
  }

  public rotate() {

  }

  public draw(): void {
    const sizes = this.getSizes()
    const scale = this.getScale()
    const context = this.getContext()
    const position = this.getPosition()

    context.clearRect(0, 0, sizes.width, sizes.height)

    context.save()
    context.translate(position.x, position.y)
    context.rotate(0.0)
    context.scale(scale.x, scale.y)

    this.getChildren().forEach((child) => child.draw(context))

    context.restore()
  }

  public contains(x: number, y: number): boolean {
    return this
      .getChildren()
      .some((child) => child.contains(x, y))
  }

  public getCorners(): Array<Primitive.PointData> {
    const position = this.getPosition()
    const {width, height} = this.getSizes()

    return [
      { x: position.x, y: position.y },                  // top-left
      { x: position.x + width, y: position.y },          // top-right
      { x: position.x + width, y: position.y + height }, // bottom-right
      { x: position.x, y: position.y + height },         // bottom-left
    ]
  }

  public add(...items: Array<Node>) {
    const children = this.getChildren()

    items.forEach((child) => {
      const type = child.getType()

      if (type === "Shape" || type === "Group") {
        children.push(child)
        child.setParent(this)
      }
    })
  }
}

