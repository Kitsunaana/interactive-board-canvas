export class GLRenderer {
  public gl: WebGLRenderingContext

  public canvas: HTMLCanvasElement

  public constructor(elementId?: string) {
    this.canvas = this._getCanvas(elementId)
    this.gl = this._getContext(this.canvas)
  }

  private _getCanvas(elementId?: string): HTMLCanvasElement {
    if (elementId !== undefined) {
      const element = document.getElementById(elementId)

      if (element instanceof HTMLCanvasElement) return element

      throw new Error(`Cannot find a canvas element named: ${elementId}`)
    } else {
      const canvas = document.createElement("canvas")
      document.body.appendChild(canvas)

      return canvas
    }
  }

  private _getContext(canvas: HTMLCanvasElement): WebGLRenderingContext {
    const context = this.canvas.getContext("webgl2")

    if (context === null) throw new Error("Unable to initialize WebGl")

    return context
  }
}