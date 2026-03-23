import { clone, isNull, isUndefined } from "lodash";
import { Container } from "./Container";
import * as Primitive from "./maths"
import { Node, type NodeConfig } from "./Node";
import { Stage } from "./Stage";
import Konva from "konva"
import { Polygon } from "./shapes";
import { type ResizeHandler, Transformer } from "./behaviors/Transformer"
import { getPointFromEvent } from "./shared/point";

export interface LayerConfig extends NodeConfig {
}

export class Layer extends Container {
  private readonly _type = "Layer" as const

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

  public stage(): Stage | null
  public stage(parent: Stage): void
  public stage(parent?: Stage) {
    if (isUndefined(parent)) return this._stage
    else this._stage = parent

    this.width(parent.width())
    this.height(parent.height())
  }

  public height(): number
  public height(value: number): void
  public height(value?: number) {
    if (isUndefined(value)) return this._canvas.height
    else this._canvas.height = value
  }

  public width(): number
  public width(value: number): void
  public width(value?: number) {
    if (isUndefined(value)) return this._canvas.width
    else this._canvas.width = value
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
    const scale = this.getScale()
    const context = this.getContext()
    const position = this.getPosition()

    context.clearRect(0, 0, this.width(), this.height())

    context.save()
    context.translate(position.x, position.y)
    context.scale(scale.x, scale.y)

    this.getChildren().forEach((child) => child.draw(context))

    context.restore()
  }

  public contains(_point: Primitive.PointData): boolean {
    return this
      .getChildren()
      .some((child) => child.contains(child.getRelativePointerPosition()))
  }

  public getCorners(): Array<Primitive.PointData> {
    const position = this.getPosition()
    const height = this.height()
    const width = this.width()

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

const stage = new Stage({
  height: window.innerHeight,
  width: window.innerWidth,
  draggable: false,
})

const layerScale = 1.0

const layer = new Layer({
  isDraggable: false,
  scaleX: layerScale,
  scaleY: layerScale,
  x: 0,
  y: 0,
})

const points1 = [{ x: 200, y: 200 }, { x: 300, y: 200 }, { x: 300, y: 120 }]
const points2 = [{ x: 400, y: 400 }, { x: 420, y: 300 }, { x: 440, y: 350 }, { x: 500, y: 300 }, { x: 500, y: 400 }]
const points = clone(points1).concat(clone(points2))

let scale = 1.0

const polygon1 = new Polygon({
  isDraggable: true,
  points: points1,
  scaleX: scale,
  scaleY: scale,
})

// const polygon2 = new Polygon({
//   points: points2,
//   scaleX: 1.0,
//   scaleY: 1.0,
//   x: 0,
//   y: 0,
// })

polygon1.scale({ x: 1.5, y: 1.5 })
polygon1.rotate(0.2)
polygon1.scale({ x: 1.5, y: 1.5 })
polygon1.rotate(0.2)
// polygon1.scale({ x: 1.5, y: 1.5 })
// polygon1.applyScale()

// polygon1.rotate(Math.PI / 4)
// polygon2.rotate(-Math.PI / 6)

const transform = new Transformer({
  isDraggable: false,
})

// transform.add(polygon1)
layer.add(polygon1)
// layer.add(polygon1, polygon2)

// const math = new Primitive.Polygon(points)
// math.getBounds(transform.initialOBB)

const side: ResizeHandler = "e"

transform.setInitialState()
transform.setHandlePosition(side)
transform.setPivotPosition(side)
transform.setWorldPivot()

window.addEventListener("pointermove", (event) => {
  transform.setTransformScale(getPointFromEvent(event))
  transform.applyTransform()

  // console.log(JSON.stringify(polygon1.math.points, null, 2))
})

stage.add(layer)

// const konva = {
//   stage: new Konva.Stage({
//     container: "app",
//     draggable: false,
//     height: 500,
//     width: 500,
//     x: 100,
//     y: 100,
//   }),

//   layer: new Konva.Layer({
//     draggable: true,
//     height: 200,
//     width: 200,
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
// }), new Konva.Circle({
//   x: 100,
//   y: 0,
//   draggable: false,
//   radius: 70,
//   fill: 'green',
//   stroke: 'black',
//   strokeWidth: 4,
// }))

// konva.stage.add(konva.layer)

// konva.stage.content.classList.add("bg-red-200")
