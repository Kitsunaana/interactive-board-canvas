import { isNull, isUndefined } from "lodash";
import { Rectangle, type PointData } from "./maths";
import { Node, type NodeConfig } from "./Node";
import { Stage } from "./Stage";

export interface LayerConfig extends NodeConfig {
  zIndex?: number
  height?: number
  width?: number
}

const toPx = (value: unknown) => `${value}px`

export class Layer extends Node {
  private readonly _type = "Layer" as const
  private readonly _children: Array<Node> = []

  private _stage: Stage | null = null

  private readonly _canvas: HTMLCanvasElement
  private readonly _context: CanvasRenderingContext2D

  private _height: number = 150
  private _width: number = 300

  private _clientRect = new Rectangle()

  public get absolutePositionCursor() {
    if (isNull(this._stage)) throw new Error("Слой должен быть добавлен в Stage")

    return this._stage.absolutePositionCursor
  }

  public constructor(config: LayerConfig) {
    super(config)

    const position = this.position()

    this._canvas = document.createElement("canvas")
    this._context = this._canvas.getContext("2d") as CanvasRenderingContext2D

    this._canvas.style.backgroundColor = "red"
    this._canvas.style.position = "absolute"
    this._canvas.style.zIndex = String(config.zIndex ?? 0)
    this._canvas.style.left = toPx(position.x)
    this._canvas.style.top = toPx(position.y)

    if (config.height) this._height = config.height
    if (config.width) this._width = config.width

    this._canvas.height = this._height
    this._canvas.width = this._width
  }

  public stage(): Stage | null
  public stage(parent: Stage): void
  public stage(parent?: Stage) {
    if (isUndefined(parent)) return this._stage
    this._stage = parent
  }

  public height(): number
  public height(value: number): void
  public height(value?: number) {
    if (isUndefined(value)) return this._height
    return this._height = value
  }

  public width(): number
  public width(value: number): void
  public width(value?: number) {
    if (isUndefined(value)) return this._width
    return this._width = value
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

  public contains(point: PointData): boolean {
    return true
  }

  public draw(context: CanvasRenderingContext2D): void {
    this._children.forEach((child) => child.draw(context))
  }

  public getClientRect(): Rectangle {
    if (this._needUpdate) {
      const position = this.position()
      this._clientRect = new Rectangle(position.x, position.y, this.width(), this.height())
    }

    return this._clientRect
  }

  public update(): void {
  }

  public add(...children: Array<Node>) {
    children.forEach((child) => {
      const type = child.getType()

      if (type === "Shape" || type === "Group") {
        this._children.push(child)
        child.parent(this)
      }
    })
  }
}

const stage = new Stage({
  height: window.innerHeight,
  width: window.innerWidth,
})

const layer = new Layer({
  height: 300,
  width: 300,
  zIndex: 1,
  x: 30,
  y: 50,
})

stage.add(layer)