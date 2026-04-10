import { Container } from "./Container"
import type { Layer } from "./Layer"
import { Point, type PointData } from "./maths"
import { getPointFromEvent } from "./shared/point"

export interface StageConfig {
  draggable: boolean
  height: number,
  width: number,
}

export type Sizes = {
  width: number
  height: number
}

export class Stage extends Container {
  private readonly _layers: Array<Layer> = []
  
  public readonly absolutePositionCursor = new Point()
  public readonly sizes: Sizes = {
    width: 0,
    height: 0,
  }

  public content: HTMLDivElement = document.createElement("div")

  protected _type: string = "Stage"

  public constructor(config: StageConfig) {
    super({})

    this.sizes.width = config.width
    this.sizes.height = config.height

    this.content.style.width = `${this.sizes.width}px`
    this.content.style.height = `${this.sizes.height}px`

    document.body.appendChild(this.content)

    window.addEventListener("pointermove", (event) => {
      this.absolutePositionCursor.copyFrom(getPointFromEvent(event))
    })

    this.render()
  }

  public getPoints(): Array<PointData> {
    return []
  }

  public getType() {
    return this._type
  }

  public draw(context: CanvasRenderingContext2D): void {
    
  }

  public render() {
    this._layers.forEach((layer) => layer.draw())
    requestAnimationFrame(this.render.bind(this))
  }

  public add(...layers: Array<Layer>) {
    layers.forEach((layer) => {
      this.content.appendChild(layer.getCanvas())
      this._layers.push(layer)
      
      layer.setStage(this)
    })
  }
}