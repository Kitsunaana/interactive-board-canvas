import { GradientData } from "../world/GradientData"
import { Node, type NodeConfig } from "./Node"

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

  public gradient: GradientData | null = null

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
    context.lineWidth = this.lineWidth
    context.fill()
    context.stroke()
  }
}
