import { isUndefined } from "lodash"
import type { Layer } from "./Layer"
import type { PointData } from "./maths"
import { getPointFromEvent } from "./shared/point"

interface StageConfig {
  draggable: boolean
  height: number,
  width: number,
}

export class Stage {
  private readonly _type = "Stage" as const

  private readonly _layers: Array<Layer> = []

  private _container: HTMLDivElement = document.createElement("div")
  private _height: number
  private _width: number

  public readonly absolutePositionCursor: PointData = {
    x: 0,
    y: 0,
  }

  public constructor(config: StageConfig) {
    this._height = config.height
    this._width = config.width

    this._container.style.width = `${this.width()}px`
    this._container.style.height = `${this.height()}px`

    document.body.appendChild(this._container)

    window.addEventListener("pointermove", (event) => {
      const cursor = getPointFromEvent(event)

      this.absolutePositionCursor.x = cursor.x
      this.absolutePositionCursor.y = cursor.y
    })

    this.render()
  }

  public height(): number
  public height(value: number): void
  public height(value?: number) {
    if (isUndefined(value)) return this._height
    this._height = value
  }

  public width(): number
  public width(value: number): void
  public width(value?: number) {
    if (isUndefined(value)) return this._width
    this._width = value
  }

  public render() {
    this._layers.forEach((layer) => layer.draw())

    requestAnimationFrame(this.render.bind(this))
  }

  public getType() {
    return this._type
  }

  public add(...layers: Array<Layer>) {
    layers.forEach((layer) => {
      this._container.appendChild(layer.getCanvas())
      this._layers.push(layer)
      layer.stage(this)
    })
  }
}