export class GLRenderer {
  public gl: WebGL2RenderingContext

  public canvas: HTMLCanvasElement

  public static gl: WebGL2RenderingContext
  public static canvas: HTMLCanvasElement

  public constructor(elementId?: string) {
    this.canvas = this._getCanvas(elementId)
    this.gl = this._getContext(this.canvas)

    GLRenderer.canvas = this.canvas
    GLRenderer.gl = this.gl
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

  private _getContext(canvas: HTMLCanvasElement): WebGL2RenderingContext {
    const context = this.canvas.getContext("webgl2")

    if (context === null) throw new Error("Unable to initialize WebGl")

    return context
  }
}