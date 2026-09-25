import { GradientData } from "../world/GradientData"
import type { Layer } from "./Layer"
import { Node, type NodeConfig } from "./Node"
import type { Stage } from "./Stage"

export type ShapeConfig = NodeConfig & {
  strokeStyle?: string
  fillStyle?: string
  lineWidth?: number
}

const fillShapeConfigDefaulValues = (config: ShapeConfig): Required<ShapeConfig> => {
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

  private _stage_v2: Stage | null = null
  public get stage_v2() { return this._stage_v2! }
  public set stage_v2(parent: Stage) { this._stage_v2 = parent }

  private _layer_v2: Layer | null = null
  public get layer_v2() { return this._layer_v2! }
  public set layer_v2(parent: Layer) { this._layer_v2 = parent }

  public constructor({ names, ...params }: ShapeConfig) {
    super({ names })

    const config = fillShapeConfigDefaulValues(params)
    Object.assign(this, config)
  }

  protected fillStrokeShape(context: CanvasRenderingContext2D) {
    context.lineWidth = this.lineWidth
    context.fillStyle = this.fillStyle
    context.strokeStyle = this.strokeStyle

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
