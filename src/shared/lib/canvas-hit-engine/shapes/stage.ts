import { isNotUndefined } from "../../utils"
import type { PointData } from "../math"
import type { Layer } from "./layer"

type StageConfig = {
  width: number
  height: number
  bgColor?: string
}

export class Stage {
  private _layers: Array<Layer> = []
  private _container: HTMLElement = document.body
  private readonly _absolutePointerPosition: PointData = {
    x: 0,
    y: 0,
  }

  public constructor(private readonly _config: StageConfig) {
    const stage = document.createElement("div")

    stage.style.width = `${this._config.width}px`
    stage.style.height = `${this._config.height}px`
    if (isNotUndefined(this._config.bgColor)) {
      stage.style.backgroundColor = this._config.bgColor
    }

    stage.oncontextmenu = (event) => event.preventDefault()

    this._container.appendChild(stage)

    const setAbsolutePointerPosition = (event: TouchEvent | PointerEvent) => {
      if (event.type === "touchmove") {
        const tEvent = event as TouchEvent
        const firstTouch = tEvent.touches[0] 

        this._absolutePointerPosition.x = firstTouch.clientX
        this._absolutePointerPosition.y = firstTouch.clientY
      }

      if (event.type === "pointermove") {
        const tEvent = event as PointerEvent

        this._absolutePointerPosition.x = tEvent.clientX
        this._absolutePointerPosition.y = tEvent.clientY
      }
    }

    stage.addEventListener("pointermove", setAbsolutePointerPosition)
    stage.addEventListener("touchmove", setAbsolutePointerPosition)
  }

  public setContainer(container: HTMLElement) {
    this._container = container
  }

  public getPointerPosition() {
    return this._absolutePointerPosition
  }

  public getIntersection() {
    throw new Error("Method is not implemented")
  }

  public getLayers() {
    return this._layers
  }

  private _validateAddChild(child: any) {
    const isLayer = child.getType() === "Layer"
    return isLayer
  }

  public shouldDrawHit() {
    return true
  }

  public clear() {
    this._layers.forEach((layer) => {
      layer.clear()
    })
  }
}