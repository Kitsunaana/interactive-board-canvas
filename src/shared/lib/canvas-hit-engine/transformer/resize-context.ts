import type {Bound} from "@/features/board/domain/selection-area"
import * as Shapes from "../shapes"
import * as Math from "../math"
import {ResizeCommitTransformerStrategy} from "./commit-strategy"
import type {ResizeTransformerStrategy} from "./interface-strategy"
import {ResizePreviewTransformerStrategy} from "./preview-strategy"

const resizePreviewStrategy = new ResizePreviewTransformerStrategy()
const resizeCommitStrategy = new ResizeCommitTransformerStrategy()

export class ResizeTransformerContext {
  public isActive = false
  public needUpdate = false

  private _strategy!: ResizeTransformerStrategy
  private _bound!: Bound | null

  public constructor(private readonly shape: Shapes.Polygon) { }

  public start(bound: Bound, cursor: Math.PointData): void {
    this._strategy = resizePreviewStrategy
    
    this._strategy.start(this.shape, bound)
    this._strategy.resize(cursor)
    
    this.isActive = true
    this._bound = bound
  }

  public commit(cursor: Math.PointData): void {
    this._strategy = resizeCommitStrategy
    
    this._strategy.start(this.shape, this._bound as Bound)
    this._strategy.resize(cursor)

    this._bound = null
    this.isActive = false
    this.needUpdate = true
  }

  public resize(cursor: Math.PointData): void {
    this._strategy.resize(cursor)
  }

  public draw(context: CanvasRenderingContext2D): void {
    this._strategy.draw(context)
  }
}
