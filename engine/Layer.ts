import { isNull, isUndefined } from "lodash";
import { Container } from "./Container";
import { ObservablePoint, type PointData } from "./maths";
import { Node, type NodeConfig } from "./Node";
import { Stage } from "./Stage";
import Konva from "konva"
import { Polygon } from "./shapes";

export interface LayerConfig extends NodeConfig {
  zIndex?: number
  height?: number
  width?: number
}

export class Layer extends Container {
  private readonly _type = "Layer" as const

  private _stage: Stage | null = null

  private readonly _canvas: HTMLCanvasElement
  private readonly _context: CanvasRenderingContext2D

  private _height: number = 150
  private _width: number = 300

  public get absolutePositionCursor() {
    if (isNull(this._stage)) throw new Error("Слой должен быть добавлен в Stage")
    return this._stage.absolutePositionCursor
  }

  public constructor(config: LayerConfig) {
    super(config)

    this._canvas = document.createElement("canvas")
    this._context = this._canvas.getContext("2d") as CanvasRenderingContext2D

    this._canvas.style.position = "absolute"
    this._canvas.style.zIndex = String(config.zIndex ?? 0)
  }

  public stage(): Stage | null
  public stage(parent: Stage): void
  public stage(parent?: Stage) {
    if (isUndefined(parent)) return this._stage

    this._stage = parent
    this.width(parent.width())
    this.height(parent.height())
    this._canvas.width = this.width()
    this._canvas.height = this.height()
  }

  public height(): number
  public height(value: number): void
  public height(value?: number) {
    if (isUndefined(value)) return this._height
    this._height = value
  }

  public width(): number
  public width(value: number): void
  public width(value?: number) {
    if (isUndefined(value)) return this._width
    this._width = value
  }

  public update(point?: ObservablePoint): void {
    if (!isUndefined(this._canvas) && !isUndefined(point)) {
    }
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

  public draw(): void {
    const scale = this.scale()
    const context = this.getContext()
    const position = this.position()

    context.clearRect(0, 0, this.width(), this.height())

    context.save()
    context.translate(position.x, position.y)
    context.scale(scale.x, scale.y)

    this.getChildren().forEach((child) => child.draw(context))

    context.restore()
  }

  // public getCorners(): Array<PointData> {
  //   const position = this.position()
  //   const height = this.height()
  //   const width = this.width()

  //   return [
  //     { x: position.x, y: position.y }, // top-left
  //     { x: position.x + width, y: position.y }, // top-right
  //     { x: position.x + width, y: position.y + height }, // bottom-right
  //     { x: position.x - width, y: position.y + height }, // bottom-left
  //   ]
  // }

  public add(...children: Array<Node>) {
    const loaded = this.getChildren()

    children.forEach((child) => {
      const type = child.getType()

      if (type === "Shape" || type === "Group") {
        loaded.push(child)
        child.parent(this)
      }
    })
  }
}

const stage = new Stage({
  height: window.innerHeight,
  width: window.innerWidth,
  draggable: true
})

const layer = new Layer({
  scaleX: 1.2,
  scaleY: 1.2,
  zIndex: 1,
  x: 100,
  y: 100,
})

layer.add(new Polygon({
  points: [{ x: 200, y: 200 }, { x: 300, y: 200 }, { x: 300, y: 120 }],
}))

stage.add(layer)

// const konva = {
//   stage: new Konva.Stage({
//     container: "app",
//     draggable: false,
//     height: 500,
//     width: 500,
//   }),

//   layer: new Konva.Layer({
//     draggable: true,
//     height: 20,
//     width: 20,
//     x: 120,
//     y: 120,
//   })
// }

// konva.layer.add(new Konva.Circle({
//   x: 0,
//   y: 0,
//   draggable: false,
//   radius: 70,
//   fill: 'red',
//   stroke: 'black',
//   strokeWidth: 4,
// }))

// konva.stage.add(konva.layer)

// konva.stage.content.classList.add("bg-red-200")