import rough from 'roughjs';
import { RoughCanvas } from "roughjs/bin/canvas";
import { Point, type PointData, Rectangle } from '../maths';
import { Container } from "./Container";
import type { Group } from './Group';
import { type GetBoundsParams, type GetPointsParams, type Node } from "./Node";
import type { Shape } from "./Shape";
import { type Sizes } from "./Stage";

declare global {
  interface CanvasRenderingContext2D {
    betweenSaveAndRestore: (callback: () => void) => void
  }
}

export type Child = Group | Shape

function betweenSaveAndRestore(this: any, drawCallback: () => void) {
  this.context.save()
  drawCallback()
  this.context.restore()
}

export class Layer extends Container {
  public static isLayer(candidate: unknown): candidate is Layer {
    return candidate instanceof Layer
  }

  public getPoints(params?: GetPointsParams): Array<PointData> {
    throw new Error("Method is not implemented")
  }

  public getBounds(params?: GetBoundsParams): Rectangle {
    throw new Error("Method is not implemented")
  }

  public getUnrotateBounds(): Rectangle {
    throw new Error("Method is not implemented")
  }

  public updateAfterTransform(): void { }

  public type: string = "Layer"

  private readonly _canvas: HTMLCanvasElement
  private readonly _context: CanvasRenderingContext2D
  private readonly _hitCanvas: HTMLCanvasElement
  private readonly _hitContext: CanvasRenderingContext2D
  private readonly _hitColorsToNodes = new Map<string, Node>()
  private readonly _nodesToHitColors = new Map<string, string>()

  private _lastHitColorId = 0
  private _rc: RoughCanvas

  public get rc(): RoughCanvas {
    return this._rc
  }

  public get worldPointer(): Point {
    return this.screenToWorld(this.stage.absolutePositionCursor)
  }

  public get sizes() {
    return {
      width: this._canvas.width,
      height: this._canvas.height,
    }
  }

  public set sizes(value: Sizes) {
    this._canvas.width = value.width
    this._canvas.height = value.height
    this._hitCanvas.width = value.width
    this._hitCanvas.height = value.height
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

    this._hitContext.betweenSaveAndRestore = betweenSaveAndRestore.bind({ context: this._hitContext })
    this._context.betweenSaveAndRestore = betweenSaveAndRestore.bind({ context: this._context })

    this._rc = rough.canvas(this._canvas)
  }

  public update(time: number) { }

  public screenToWorld(point: Point): Point {
    return point
  }

  public get canvas(): HTMLCanvasElement {
    return this._canvas
  }

  public get hitCanvas(): HTMLCanvasElement {
    return this._hitCanvas
  }

  public get context(): CanvasRenderingContext2D {
    return this._context
  }

  public get hitContext(): CanvasRenderingContext2D {
    return this._hitContext
  }

  public getHitColor(shape: Node): string {
    const current = this._nodesToHitColors.get(shape.id)
    if (current) return current

    const next = this._createUniqueHitColor()

    this._nodesToHitColors.set(shape.id, next)
    this._hitColorsToNodes.set(next, shape)

    return next
  }

  public getIntersection(point: PointData): Node | null {
    const sizes = this.sizes

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
    const sizes = this.sizes
    const context = this.context

    context.clearRect(0, 0, sizes.width, sizes.height)

    this.children.forEach((child) => {
      child.render(context)
    })
  }

  public renderHit(): void {
    const sizes = this.sizes
    const context = this.hitContext

    context.clearRect(0, 0, sizes.width, sizes.height)

    context.fillStyle = this.getHitColor(this)
    context.fillRect(0, 0, sizes.width, sizes.height)

    this.children.forEach((child) => {
      child.renderHit(context)
    })
  }

  private _createUniqueHitColor(): string {
    const r = Math.floor(Math.random() * 255)
    const g = Math.floor(Math.random() * 255)
    const b = Math.floor(Math.random() * 255)

    return Layer._toHitColor(r, g, b)

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
