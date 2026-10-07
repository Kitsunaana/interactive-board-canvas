import { GradientData } from "../world/GradientData"
import type { Layer } from "./Layer"
import { Node, type NodeConfig } from "./Node"
import type { Stage } from "./Stage"

export type ShapeConfig = NodeConfig & {
  strokeStyle?: string
  fillStyle?: string
  lineWidth?: number
}

const fillShapeConfigDefaultValues = (config: ShapeConfig): Required<ShapeConfig> => {
  return {
    strokeStyle: "black",
    fillStyle: "skyblue",
    lineWidth: 1,
    names: [],

    ...config,
  }
}

export abstract class Shape extends Node {
  public static isShape(candidate: unknown): candidate is Shape {
    return candidate instanceof Shape
  }

  public strokeStyle: string = "black"
  public fillStyle: string = "skyblue"
  public lineWidth: number = 1
  public hitLineWidth: number = 10

  public gradient: GradientData | null = null

  private _stage: Stage | null = null
  private _layer: Layer | null = null
  
  public get stage() { 
    return this._stage!
  }

  public get layer() {
    return this._layer!
  }
  
  public set stage(parent: Stage) { 
    this._stage = parent
  }
  
  public set layer(parent: Layer) {
    this._layer = parent 
  }

  public constructor({ names, ...params }: ShapeConfig) {
    super({ names })

    const config = fillShapeConfigDefaultValues(params)
    Object.assign(this, config)
  }

  public drawBounds: boolean = false

  protected fillStrokeShape(context: CanvasRenderingContext2D) {
    context.lineWidth = this.lineWidth
    context.fillStyle = this.fillStyle
    context.strokeStyle = this.strokeStyle

    if (this.drawBounds) {
      context.betweenSaveAndRestore(() => {
        const bounds = this.getBounds()

        context.lineWidth = 3
        context.strokeStyle = "red"
        context.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height)
      })
    }

    context.fill()
    context.stroke()

    this.gradient?.applyToContext(context, this)
  }

  protected fillStrokeHitShape(context: CanvasRenderingContext2D) {
    const color = this.layer.getHitColor(this)

    context.fillStyle = color
    context.strokeStyle = color
    context.lineWidth = this.hitLineWidth
    context.fill()
    context.stroke()
  }
}
