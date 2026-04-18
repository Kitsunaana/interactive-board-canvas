import { isNull } from "lodash";
import { Container } from "./Container";
import { Group } from "./Group";
import * as Primitive from "./maths";
import { Node, type NodeConfig } from "./Node";
import { Shape } from "./shapes/Shape";
import { type Sizes, Stage } from "./Stage";

export interface LayerConfig extends NodeConfig {
}

export class Layer extends Container<Group | Shape> {
  protected readonly _type = "Layer"

  private _stage: Stage | null = null

  private readonly _canvas: HTMLCanvasElement
  private readonly _context: CanvasRenderingContext2D
  private readonly _hitCanvas: HTMLCanvasElement
  private readonly _hitContext: CanvasRenderingContext2D
  private readonly _hitColorsToNodes = new Map<string, Shape>()
  private readonly _nodesToHitColors = new Map<string, string>()
  private _lastHitColorId = 0

  public get absolutePositionCursor() {
    if (isNull(this._stage)) throw new Error("Слой должен быть добавлен в Stage")
    return this._stage.absolutePositionCursor
  }

  public constructor(config: LayerConfig) {
    super(config)

    this._canvas = document.createElement("canvas")
    this._context = this._canvas.getContext("2d") as CanvasRenderingContext2D
    this._hitCanvas = document.createElement("canvas")
    this._hitContext = this._hitCanvas.getContext("2d", {
      willReadFrequently: true
    }) as CanvasRenderingContext2D
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
    this._hitCanvas.width = sizes.width
    this._hitCanvas.height = sizes.height
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

  public getHitCanvas() {
    return this._hitCanvas
  }

  public getHitContext() {
    return this._hitContext
  }

  public getHitColor(shape: Shape): string {
    const current = this._nodesToHitColors.get(shape.id)
    if (current) {
      return current
    }

    const next = this._createUniqueHitColor()
    this._nodesToHitColors.set(shape.id, next)
    this._hitColorsToNodes.set(next, shape)

    return next
  }

  public getIntersection(point: Primitive.PointData): Shape | null {
    const sizes = this.getSizes()
    const x = Math.floor(point.x)
    const y = Math.floor(point.y)

    if (x < 0 || y < 0 || x >= sizes.width || y >= sizes.height) {
      return null
    }

    const pixel = this._hitContext.getImageData(x, y, 1, 1).data
    if (pixel[3] === 0) return null

    const color = Layer._toHitColor(pixel[0], pixel[1], pixel[2])
    const rgb = `rgb(${color})`

    return this._hitColorsToNodes.get(rgb) ?? null
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
    const hitContext = this.getHitContext()
    const position = this.getPosition()

    context.clearRect(0, 0, sizes.width, sizes.height)
    hitContext.clearRect(0, 0, sizes.width, sizes.height)

    context.save()
    context.translate(position.x, position.y)
    context.rotate(0.0)
    context.scale(scale.x, scale.y)

    this.getChildren().forEach((child) => child.draw(context))

    context.restore()

    hitContext.save()
    hitContext.translate(position.x, position.y)
    hitContext.rotate(0.0)
    hitContext.scale(scale.x, scale.y)

    this.getChildren().forEach((child) => child.drawHit(hitContext))

    hitContext.restore()
  }

  public drawHit(context: CanvasRenderingContext2D): void {
    const position = this.getPosition()
    const scale = this.getScale()

    context.save()
    context.translate(position.x, position.y)
    context.rotate(0.0)
    context.scale(scale.x, scale.y)

    this.getChildren().forEach((child) => child.drawHit(context))

    context.restore()
  }

  public contains(x: number, y: number): boolean {
    return this
      .getChildren()
      .some((child) => child.contains(x, y))
  }

  public getCorners(): Array<Primitive.PointData> {
    const position = this.getPosition()
    const { width, height } = this.getSizes()

    return [
      { x: position.x, y: position.y },                  // top-left
      { x: position.x + width, y: position.y },          // top-right
      { x: position.x + width, y: position.y + height }, // bottom-right
      { x: position.x, y: position.y + height },         // bottom-left
    ]
  }

  public add(...items: Array<Group | Shape>) {
    const children = this.getChildren()

    items.forEach((child) => {
      const type = child.getType()

      if (type === "Shape" || type === "Group") {
        children.push(child)
        child.setParent(this)
      }
    })
  }

  private _createUniqueHitColor(): string {
    const r = Math.floor(Math.random() * 255)
    const g = Math.floor(Math.random() * 255)
    const b = Math.floor(Math.random() * 255)
    return `rgb(${r},${g},${b})`
    while (this._lastHitColorId < 0xffffff) {
      this._lastHitColorId += 1

      const color = Layer._toHitColor(
        (this._lastHitColorId >> 16) & 255,
        (this._lastHitColorId >> 8) & 255,
        this._lastHitColorId & 255
      )

      if (!this._hitColorsToNodes.has(color)) {
        return color
      }
    }

    throw new Error("Закончились уникальные hit-цвета для слоя")
  }

  private static _toHitColor(red: number, green: number, blue: number): string {
    return `${red},${green},${blue}`
  }
}

