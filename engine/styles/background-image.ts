import { isNil } from "lodash"
import { BackgroundSizeParser } from "../components/string-size-parser"
import { Bounds, Matrix3x3, Point, Rectangle, type PointData } from "../maths"
import type { SimObject } from "../world/sim-object"

const iterate = (start: number, end: number, callback: (i: number) => void) => {
  for (let col = start; col <= end; col++) {
    callback(col)
  }
}

export type BackgroundImageRepeat = "repeat" | "repeat-x" | "repeat-y" | "no-repeat"

export class BackgroundImage {
  private _simObject: SimObject | null = null

  private _container: Rectangle = new Rectangle(0, 0, 1, 1)
  private _image: HTMLImageElement | null = null
  private _isLoaded: boolean = false

  private _repeat: BackgroundImageRepeat = "no-repeat"
  private _position: Point = new Point(0, 0)

  private _backgroundSizeParser: BackgroundSizeParser = new BackgroundSizeParser()
  private _extractedBackgroundSize: Point | null = null
  private _needApplyBackgroundCssValue: string = "auto"

  public _pattern: CanvasPattern | null = null
  public _dirty: boolean = true

  public get simObject(): SimObject {
    if (isNil(this._simObject)) throw new Error("Объект не добавлен")
    return this._simObject
  }

  public setSimObject(object: SimObject): this {
    this._simObject = object
    return this
  }

  public setContainer(container: Rectangle): this {
    this._container.copyFrom(container)

    this._backgroundSizeParser.containerBounds = container.clone()
    this._extractedBackgroundSize = this._backgroundSizeParser.parse(this._needApplyBackgroundCssValue)

    this._markDirty()

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
    this._needApplyBackgroundCssValue = cssValue
    this._extractedBackgroundSize = this._backgroundSizeParser.parse(cssValue)

    return this
  }

  public setBackgroundRepeat(variant: BackgroundImageRepeat): this {
    this._repeat = variant
    return this
  }

  public getImagePattern(context: CanvasRenderingContext2D): CanvasPattern | null {
    if (this._dirty || this._pattern === null) {
      this._pattern = this._computeImagePattern(context)
      this._dirty = false
    }

    this._pattern = this._computeImagePattern(context)

    return this._pattern
  }

  private _markDirty(): void {
    this._dirty = true
  }

  private _drawImage(context: OffscreenCanvasRenderingContext2D, col: number, row: number): void {
    const size = this._extractedBackgroundSize!
    const position = new Point(col, row).mul(size).sub(this._position)

    context.drawImage(this._image!, ...position.array(), ...size.array())
  }

  private _computeImagePattern(context: CanvasRenderingContext2D): CanvasPattern | null {
    if (this._isLoaded && this._image) {
      const shapeBounds = new Bounds()
      shapeBounds.x = this._container.x
      shapeBounds.y = this._container.y
      shapeBounds.width = this._container.width
      shapeBounds.height = this._container.height

      if (!shapeBounds.isValid) return null

      const offscreen = new OffscreenCanvas(shapeBounds.width, shapeBounds.height)
      const offContext = offscreen.getContext('2d', { alpha: true })
      if (!offContext) return null

      offContext.fillStyle = "blue"
      offContext.clearRect(0, 0, shapeBounds.width, shapeBounds.height)
      offContext.fillRect(0, 0, shapeBounds.width, shapeBounds.height)

      const size = this._extractedBackgroundSize!

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

      const rotateOrigin = this.simObject.getInLocalOriginPosition("rotate")

      const rotate = Matrix3x3.aroundOrigin(rotateOrigin, () => Matrix3x3.rotate(this.simObject.getCurrentAngle()))
      const translate = Matrix3x3.translate(...shapeBounds.point().array())
      const matrix = Matrix3x3.compose(rotate, translate)

      pattern.setTransform(matrix)

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
        this._backgroundSizeParser._image = this._image
        this._backgroundSizeParser.containerBounds = this._container
        this._extractedBackgroundSize = this._backgroundSizeParser.parse(this._needApplyBackgroundCssValue)
      }
    }
  }
}
