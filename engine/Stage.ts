import type { Layer } from "./Layer"
import type { PointData } from "./maths"

interface StageConfig {
  height: number,
  width: number,
}

export class Stage {
  private readonly _type = "Stage" as const

  private readonly layers: Array<Layer> = []

  private _container: HTMLElement = document.body
  private _height: number
  private _width: number

  public readonly absolutePositionCursor: PointData = {
    x: 0,
    y: 0,
  }

  public constructor(config: StageConfig) {
    this._height = config.height
    this._width = config.width
  }

  public getType() {
    return this._type
  }

  public add(...layers: Array<Layer>) {
    layers.forEach((layer) => {
      this._container.appendChild(layer.getCanvas())
      this.layers.push(layer)
      layer.stage(this)
    })
  }
}