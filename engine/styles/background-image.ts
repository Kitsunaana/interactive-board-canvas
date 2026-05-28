import { BaseShapeComponent } from "../components/base-shape-component"
import { BackgroundSizeParser } from "../components/string-size-parser"
import { Matrix3x3, Point, type PointData } from "../maths"

const iterate = (start: number, end: number, callback: (i: number) => void) => {
  for (let col = start; col <= end; col++) {
    callback(col)
  }
}

export type BackgroundImageRepeat = "repeat" | "repeat-x" | "repeat-y" | "no-repeat"

export class BackgroundImage {
  private _component: BaseShapeComponent | null = null
  private _image: HTMLImageElement | null = null
  private _isLoaded: boolean = false

  private _repeat: BackgroundImageRepeat = "no-repeat"
  private _position: Point = new Point(0, 0)

  private _backgroundSizeParser: BackgroundSizeParser | null = null
  private _extractedBackgroundSize: Point | null = null
  private _needApplyBackgroundCssValue: string = "auto"

  public _pattern: CanvasPattern | null = null
  public _dirty: boolean = false

  public get component() {
    if (this._component === null) throw new Error("Компонента не определена")
    return this._component
  }

  public setComponent(component: BaseShapeComponent): this {
    this._component = component
    return this
  }

  public setBackgroundPosition(delta: PointData): this {
    this._position.copyFrom(this._position.add(delta))
    this._markDirty()
    return this
  }

  public setBackgroundImage(source: string) {
    this._imageLoad(source)
    return this
  }

  public setBackgroundSize(cssValue: string): this {
    if (this._backgroundSizeParser) this._extractedBackgroundSize = this._backgroundSizeParser.parse(cssValue)
    else this._needApplyBackgroundCssValue = cssValue

    return this
  }

  public setBackgroundRepeat(variant: BackgroundImageRepeat): this {
    this._repeat = variant
    return this
  }

  public getImagePattern(context: CanvasRenderingContext2D): CanvasPattern | null {
    if (this._dirty === false || this._pattern === null) {
      this._pattern = this._computeImagePattern(context)
      this._dirty = true
    }

    return this._pattern
  }

  private _markDirty(): void {
    this._dirty = false
  }

  private _drawImage(context: OffscreenCanvasRenderingContext2D, col: number, row: number): void {
    const size = this._extractedBackgroundSize!
    const position = new Point(col, row).mul(size).sub(this._position)

    context.drawImage(this._image!, ...position.array(), ...size.array())
  }

  private _computeImagePattern(context: CanvasRenderingContext2D): CanvasPattern | null {
    if (this._isLoaded && this._image) {
      const shapeBounds = this.component.getBounds()

      const offscreen = new OffscreenCanvas(shapeBounds.width, shapeBounds.height)
      const offContext = offscreen.getContext('2d', { alpha: true })
      if (!offContext) return null

      const size = this._extractedBackgroundSize as Point

      offContext.fillStyle = "transparent"
      offContext.clearRect(0, 0, shapeBounds.width, shapeBounds.height)
      offContext.fillRect(0, 0, shapeBounds.width, shapeBounds.height)

      const start = this._position.div(size).floor().sub(Point.one())
      const end = this._position.add(Point.fromSize(shapeBounds)).div(size).ceil().add(Point.one());

      ({
        "repeat-x": () => iterate(start.x, end.x, (col) => this._drawImage(offContext, col, 0)),
        "repeat-y": () => iterate(start.y, end.y, (row) => this._drawImage(offContext, 0, row)),
        "repeat": () => iterate(start.y, end.y, (row) => iterate(start.x, end.x, (col) => this._drawImage(offContext, col, row))),
        "no-repeat": () => this._drawImage(offContext, 0, 0),
      })[this._repeat]()

      const pattern = context.createPattern(offscreen, 'no-repeat')
      if (!pattern) return null

      pattern.setTransform(Matrix3x3.translate(...shapeBounds.point().array()))

      return pattern
    }

    return null
  }

  private _imageLoad(source: string): void {
    const image = new Image()

    image.src = source
    image.onload = (data) => {
      this._isLoaded = true

      if (data.target instanceof HTMLImageElement) {
        this._image = data.target
        this._backgroundSizeParser = new BackgroundSizeParser(this._image, this.component.getBounds())
        this._extractedBackgroundSize = this._backgroundSizeParser.parse(this._needApplyBackgroundCssValue)
      }
    }
  }
}
