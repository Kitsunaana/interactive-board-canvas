import { isNull, isUndefined } from "lodash"
import { Polygon } from "../shapes"
import { RotateGroupTransformer } from "./v2/rotate-group"
import { RotateShapeTransform } from "./v2/rotate-shape"
import type { RotateTransformerController } from "./v2/rotate.interface"

export class Transformer {
  private _resizeEnabled: boolean = true
  private _rotateEnabled: boolean = true
  private _rotateAnchorOffset: number = 20
  private _rotateAnchorCursor: string = "croohair"
  private _padding: number = 7

  private _nodes: Polygon[] = []

  private _rotater: RotateTransformerController | null = null

  public resizeEnabled(): boolean
  public resizeEnabled(enabled: boolean): void
  public resizeEnabled(enabled?: boolean) {
    if (isUndefined(enabled)) return this._resizeEnabled
    this._resizeEnabled = enabled
    return undefined
  }

  public rotateEnabled(): boolean
  public rotateEnabled(enabled: boolean): void
  public rotateEnabled(enabled?: boolean) {
    if (isUndefined(enabled)) return this._rotateEnabled
    this._rotateEnabled = enabled
    return undefined
  }

  public rotateAnchorOffset(): number
  public rotateAnchorOffset(value: number): void
  public rotateAnchorOffset(value?: number) {
    if (isUndefined(value)) return this._rotateAnchorOffset
    this._rotateAnchorOffset = value
    return undefined
  }

  public rotateAnchorCursor(): string
  public rotateAnchorCursor(value: string): void
  public rotateAnchorCursor(value?: string) {
    if (isUndefined(value)) return this._rotateAnchorCursor
    this._rotateAnchorCursor = value
    return undefined
  }

  public padding(): number
  public padding(value: number): void
  public padding(value?: number) {
    if (isUndefined(value)) return this._padding
    this._padding = value
    return undefined
  }

  public nodes(): Polygon[]
  public nodes(list: Polygon[]): void
  public nodes(list?: Polygon[]) {
    if (isUndefined(list)) return this._nodes
    this._nodes = list

    if (isNull(this._rotater) && this._nodes.length > 0) {
      this._rotater = this._nodes.length === 1
        ? new RotateShapeTransform(this)
        : new RotateGroupTransformer(this)

      this._rotater.start()
    }

    return undefined
  }

  public draw(context: CanvasRenderingContext2D) {
    this._rotater?.draw(context)
  }
}
