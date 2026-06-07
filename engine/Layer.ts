import rough from 'roughjs'
import { isUndefined } from "lodash";
import * as Primitive from "./maths";
import { type Sizes, Stage } from "./Stage";
import { SimObject } from "./world/sim-object";
import { RoughCanvas } from "roughjs/bin/canvas";

export interface LayerConfig {
}

export class Layer extends SimObject {
  protected readonly _type = "Layer"

  private _stage: Stage | null = null

  private readonly _canvas: HTMLCanvasElement
  private readonly _context: CanvasRenderingContext2D
  private readonly _hitCanvas: HTMLCanvasElement
  private readonly _hitContext: CanvasRenderingContext2D
  private readonly _hitColorsToNodes = new Map<string, SimObject>()
  private readonly _nodesToHitColors = new Map<string, string>()

  private _lastHitColorId = 0

  public rc: RoughCanvas

  public constructor() {
    super()

    this._canvas = document.createElement("canvas")
    this._context = this._canvas.getContext("2d", { alpha: true }) as CanvasRenderingContext2D
    this._hitCanvas = document.createElement("canvas")
    this._hitContext = this._hitCanvas.getContext("2d", {
      willReadFrequently: true,
      alpha: true,
    }) as CanvasRenderingContext2D

    this.rc = rough.canvas(this._canvas)
  }

  public getBounds(): Primitive.Rectangle {
    return new Primitive.Rectangle(0, 0, 1, 1)
  }

  public getSelfRect(): Primitive.Rectangle {
    return new Primitive.Rectangle(0, 0, 1, 1)
  }

  public getPoints(): Array<Primitive.PointData> {
    return []
  }

  public stage(): Stage | null
  public stage(stage: Stage): void
  public stage(stage?: Stage): Stage | null | void {
    if (isUndefined(stage)) return this._stage

    this._stage = stage
    this.sizes(stage.sizes)
  }

  public sizes(): Sizes
  public sizes(sizes: Sizes): void
  public sizes(sizes?: Sizes): Sizes | void {
    if (isUndefined(sizes)) {
      return {
        width: this._canvas.width,
        height: this._canvas.height,
      }
    }

    this._canvas.width = sizes.width
    this._canvas.height = sizes.height
    this._hitCanvas.width = sizes.width
    this._hitCanvas.height = sizes.height
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

  public getHitColor(shape: SimObject): string {
    const current = this._nodesToHitColors.get(shape.id)
    if (current) return current

    const next = this._createUniqueHitColor()

    this._nodesToHitColors.set(shape.id, next)
    this._hitColorsToNodes.set(next, shape)

    return next
  }

  public getIntersection(point: Primitive.PointData): SimObject | null {
    const sizes = this.sizes()

    const x = Math.floor(point.x)
    const y = Math.floor(point.y)

    if (x < 0 || y < 0 || x >= sizes.width || y >= sizes.height) {
      return null
    }

    const pixel = this._hitContext.getImageData(x, y, 1, 1).data
    if (pixel[3] === 0) return null

    const color = Layer._toHitColor(pixel[0], pixel[1], pixel[2])

    return this._hitColorsToNodes.get(color) ?? null
  }

  public render(): void {
    const sizes = this.sizes()
    const context = this.getContext()
    const hitContext = this.getHitContext()

    context.clearRect(0, 0, sizes.width, sizes.height)
    hitContext.clearRect(0, 0, sizes.width, sizes.height)

    this.children().forEach((child) => {
      child.render(context)
      child.renderHit(hitContext)
    })
  }

  public renderHit(context: CanvasRenderingContext2D): void {
    this.children().forEach((child) => child.renderHit(context))
  }

  public contains(x: number, y: number): boolean {
    return this
      .children()
      .some((child) => child.contains(x, y))
  }

  public getCorners(): Array<Primitive.PointData> {
    const position = new Primitive.Point(0, 0)
    const { width, height } = this.sizes()

    return [
      { x: position.x, y: position.y },                  // top-left
      { x: position.x + width, y: position.y },          // top-right
      { x: position.x + width, y: position.y + height }, // bottom-right
      { x: position.x, y: position.y + height },         // bottom-left
    ]
  }

  public add(...items: Array<SimObject>): void {
    items.forEach((child) => {
      this.children(child)
      child.layer(this)
    })
  }

  private _createUniqueHitColor(): string {
    while (this._lastHitColorId < 0xffffff) {
      this._lastHitColorId += 1

      const red = (this._lastHitColorId >> 16) & 255
      const green = (this._lastHitColorId >> 8) & 255
      const blue = this._lastHitColorId & 255

      const color = Layer._toHitColor(red, green, blue)

      if (!this._hitColorsToNodes.has(color)) {
        return color
      }
    }

    throw new Error("Закончились уникальные hit-цвета для слоя")
  }

  private static _toHitColor(red: number, green: number, blue: number): string {
    return `rgb(${red},${green},${blue})`
  }
}

