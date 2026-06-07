import { isNil } from "lodash"
import { Point, Rectangle, type SizeData } from "../maths"

export type BackgroundSizeKeyword = "auto" | "contain" | "cover"

export type SizeDimension = keyof SizeData

export class BackgroundSizeParser {
  public static readonly VALID_KEYWORDS: Array<BackgroundSizeKeyword> = ["auto", "contain", "cover"]

  private static _isPixelValue(value: string): boolean {
    return value.endsWith("px")
  }

  private static _isPercentageValue(value: string): boolean {
    return value.endsWith("%")
  }

  private static _isInvalidNumericParse(value: unknown): boolean {
    return Number.isNaN(value)
  }

  private static _extractPixelValue(value: string): number {
    return Number(value.slice(0, -2))
  }

  private static _extractPercentageFraction(value: string): number {
    return Number(value.slice(0, -1)) / 100
  }

  public constructor(
    public _image: HTMLImageElement | null = null,
    public containerBounds: Rectangle = new Rectangle(0, 0, 1, 1)
  ) {
  }

  private get image(): HTMLImageElement {
    if (isNil(this._image)) throw new Error("Изображение не загружено")
    return this._image
  }

  public parse(cssValue: string): Point | null {
    if (isNil(this._image)) return null

    const tokens = cssValue.trim().split(/\s+/)

    if (tokens.length === 1 && BackgroundSizeParser.VALID_KEYWORDS.includes(tokens[0] as BackgroundSizeKeyword)) {
      return this._resolveByKeyword(tokens[0] as BackgroundSizeKeyword)
    }

    if (tokens.length === 2) {
      return this._resolveDualValues(tokens[0], tokens[1])
    }

    return this._resolveSingleValue(tokens[0])
  }

  private _calculateAspectScaledDimension = (resolvedDimension: number, sourceDimension: SizeDimension): number => {
    const targetDimension: SizeDimension = sourceDimension === "width" ? "height" : "width"
    const aspectRatio = resolvedDimension / this._image![sourceDimension]

    return this._image![targetDimension] * aspectRatio
  }

  private _resolveDimensionValue(widthToken: string, heightToken: string, dimension: SizeDimension): number {
    const token = dimension === "width" ? widthToken : heightToken

    if (BackgroundSizeParser._isPercentageValue(token)) {
      const infered = BackgroundSizeParser._extractPercentageFraction(token)
      if (BackgroundSizeParser._isInvalidNumericParse(infered)) return this.image[dimension]

      return this.containerBounds[dimension] * infered
    }

    if (BackgroundSizeParser._isPixelValue(token)) {
      const infered = BackgroundSizeParser._extractPixelValue(token)
      if (BackgroundSizeParser._isInvalidNumericParse(infered)) return this.image[dimension]

      return infered
    }

    return this.image[dimension]
  }

  private _resolveDualValues(widthToken: string, heightToken: string): Point {
    const isWidthAuto = widthToken === "auto"
    const isHeightAuto = heightToken === "auto"

    if (isWidthAuto && !isHeightAuto) {
      const height = this._resolveDimensionValue(widthToken, heightToken, "height")
      const width = this._calculateAspectScaledDimension(height, "height")

      return new Point(width, height)
    }

    if (!isWidthAuto && isHeightAuto) {
      const width = this._resolveDimensionValue(widthToken, heightToken, "width")
      const height = this._calculateAspectScaledDimension(width, "width")

      return new Point(width, height)
    }

    if (!isWidthAuto && !isHeightAuto) {
      const width = this._resolveDimensionValue(widthToken, heightToken, "width")
      const height = this._resolveDimensionValue(widthToken, heightToken, "height")

      return new Point(width, height)
    }

    return Point.fromSize(this.image)
  }

  private _resolveSingleValue(token: string): Point {
    const width = this._resolveDimensionValue(token, "auto", "width")
    const height = this._calculateAspectScaledDimension(width, "width")

    return new Point(width, height)
  }

  private _resolveByKeyword(keyword: BackgroundSizeKeyword): Point {
    if (keyword === "auto") return Point.fromSize(this.image)

    const imagePoint = Point.fromSize(this.image)
    const boundPoint = Point.fromSize(this.containerBounds)

    const ratios = boundPoint.div(imagePoint).array()
    const scaleFn = keyword === "contain" ? Math.min : Math.max

    const scale = scaleFn(...ratios)

    return imagePoint.scale(scale)
  }
}
