import { isEmpty, isNull, isUndefined } from "lodash";
import rough from 'roughjs';
import { RoughCanvas } from "roughjs/bin/canvas";
import { Group } from './Group';
import * as Primitive from "./maths";
import { Shape } from './shapes/Shape';
import { type Sizes, Stage } from "./Stage";
import { type GetBoundsParams, SimObject } from "./world/sim-object";

export type Child = Group | Shape

export class LayerV2 extends SimObject {
  public getBounds(params?: GetBoundsParams): Primitive.Rectangle {
    return new Primitive.Rectangle(0, 0, 1, 1)
  }

  public getUnrotateBounds(): Primitive.Rectangle {
    return new Primitive.Rectangle(0, 0, 1, 1)
  }

  public updateAfterTransform(): void {

  }

  protected readonly _type = "Layer"

  private _stage: Stage | null = null

  private readonly _canvas: HTMLCanvasElement
  private readonly _context: CanvasRenderingContext2D
  private readonly _hitCanvas: HTMLCanvasElement
  private readonly _hitContext: CanvasRenderingContext2D
  private readonly _hitColorsToNodes = new Map<string, SimObject>()
  private readonly _nodesToHitColors = new Map<string, string>()

  protected readonly _children: Array<Child> = []

  private _lastHitColorId = 0
  private _rc: RoughCanvas

  public get rc(): RoughCanvas {
    return this._rc
  }

  public constructor() {
    super()

    this._canvas = document.createElement("canvas")
    this._context = this._canvas.getContext("2d", { alpha: true }) as CanvasRenderingContext2D
    this._hitCanvas = document.createElement("canvas")
    this._hitContext = this._hitCanvas.getContext("2d", {
      willReadFrequently: true,
      alpha: true,
    }) as CanvasRenderingContext2D

    this._rc = rough.canvas(this._canvas)
  }

  public screenToWorld(point: Primitive.Point): Primitive.Point {
    return point
  }

  public update(time: number) { }

  public getCanvas(): HTMLCanvasElement {
    return this._canvas
  }

  public getContext(): CanvasRenderingContext2D {
    return this._context
  }

  public getHitCanvas(): HTMLCanvasElement {
    return this._hitCanvas
  }

  public getHitContext(): CanvasRenderingContext2D {
    return this._hitContext
  }

  public getStageOrThrow(): Stage {
    const stage = this.stage()
    if (isNull(stage)) throw new Error("Layer не добавлен ни в один слой")
    return stage
  }

  public children(): Array<Child>
  public children(...list: Array<Child>): void
  public children(...list: Array<Child>): Array<Child> | void {
    if (isEmpty(list)) return this._children

    list.forEach((child) => {
      this._children.push(child)

      child.layer(this)
      child.fire("addToParent")
    })
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

    const color = LayerV2._toHitColor(pixel[0], pixel[1], pixel[2])

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

  private _createUniqueHitColor(): string {
    const r = Math.floor(Math.random() * 255)
    const g = Math.floor(Math.random() * 255)
    const b = Math.floor(Math.random() * 255)

    return LayerV2._toHitColor(r, g, b)

    while (this._lastHitColorId < 0xffffff) {
      this._lastHitColorId += 1

      const red = (this._lastHitColorId >> 16) & 255
      const green = (this._lastHitColorId >> 8) & 255
      const blue = this._lastHitColorId & 255

      const color = LayerV2._toHitColor(red, green, blue)

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
