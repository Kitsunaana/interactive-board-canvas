import { isNil } from "lodash"
import { BaseShapeComponent } from "../components/base-shape-component"
import { BackgroundSizeParser } from "../components/string-size-parser"
import { Matrix3x3, Point, Rectangle, type PointData } from "../maths"

const iterate = (start: number, end: number, callback: (i: number) => void) => {
  for (let col = start; col <= end; col++) {
    callback(col)
  }
}

export type BackgroundImageRepeat = "repeat" | "repeat-x" | "repeat-y" | "no-repeat"

export class BackgroundImage {
  private _component: BaseShapeComponent | null = null
  private _container: Rectangle = new Rectangle(0, 0, 1, 1)
  private _image: HTMLImageElement | null = null
  private _isLoaded: boolean = false

  private _repeat: BackgroundImageRepeat = "no-repeat"
  private _position: Point = new Point(0, 0)

  private _backgroundSizeParser: BackgroundSizeParser | null = null
  private _extractedBackgroundSize: Point | null = null
  private _needApplyBackgroundCssValue: string = "auto"

  public _pattern: CanvasPattern | null = null
  public _dirty: boolean = true

  public get component() {
    if (this._component === null) throw new Error("Компонента не определена")
    return this._component
  }

  public setComponent(component: BaseShapeComponent): this {
    this._component = component
    return this
  }

  public setContainer(container: Rectangle): this {
    this._container = container
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
    if (this._dirty || this._pattern === null) {
      this._pattern = this._computeImagePattern(context)
      this._dirty = false
    }

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
      const shapeBounds = this._container

      const offscreen = new OffscreenCanvas(shapeBounds.width, shapeBounds.height)
      const offContext = offscreen.getContext('2d', { alpha: true })
      if (!offContext) return null

      offContext.fillStyle = "blue"
      offContext.clearRect(0, 0, shapeBounds.width, shapeBounds.height)
      offContext.fillRect(0, 0, shapeBounds.width, shapeBounds.height)

      const size = this._extractedBackgroundSize!

      const start = this._position.div(size).floor().sub(Point.one())
      const end = this._position.add(Point.fromSize(shapeBounds)).div(size).ceil().add(Point.one());

      const currentAngle = Math.atan2(this.component.transformMatrix.b, this.component.transformMatrix.a);
      const matrix = Matrix3x3.aroundOrigin(Point.fromSize(shapeBounds).scale(0.5), () => Matrix3x3.rotate(currentAngle));

      offContext.setTransform(matrix);
      // matrix.applyToContext(offContext);

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
        this._backgroundSizeParser = new BackgroundSizeParser(this._image, this._container)
        this._extractedBackgroundSize = this._backgroundSizeParser.parse(this._needApplyBackgroundCssValue)
      }
    }
  }
}
