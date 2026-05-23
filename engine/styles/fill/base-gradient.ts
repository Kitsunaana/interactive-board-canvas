import { BaseShapeComponent } from "../../components/base-shape-component"

export abstract class BaseGradient {
  public abstract computeGradient(context: CanvasRenderingContext2D): CanvasGradient

  public colorStops: Array<[number, string]> = []

  private _dirty: boolean = true
  private _gradient: CanvasGradient | null = null
  private _component: BaseShapeComponent | null = null

  public get component() {
    if (this._component === null) throw new Error("Компонента не определена")
    return this._component
  }

  public setColorStops(stops: Array<number | string>): this {
    if (stops.length % 2 === 1) return this

    const parsedStops: Array<[number, string]> = []

    for (let i = 0; i < stops.length; i += 2) {
      const offset = parseFloat(String(stops[i]))
      const color = String(stops[i + 1])

      if (typeof offset === "number" && typeof color === "string") {
        parsedStops.push([offset, color])
      }
    }

    this.colorStops = parsedStops
    return this
  }

  public getGradient(context: CanvasRenderingContext2D): CanvasGradient {
    if (this._dirty === false || this._gradient === null) {
      this._gradient = this.computeGradient(context)
      this._dirty = true
    }

    return this._gradient
  }

  public setComponent(component: BaseShapeComponent): this {
    this._component = component
    return this
  }

  public markDirty() {
    this._dirty = false
  }
}
