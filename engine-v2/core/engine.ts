import { GLRenderer } from "./gl/gl"
import { Shader } from "./gl/shader"
import { vertexShaderSource, fragmentShaderSource } from "./shaders/shader.ts"

export type ResizeEvent = {
  target: {
    innerWidth: number
    innerHeight: number
  }
}

export interface Resizeable {
  onresize: (<T extends ResizeEvent>(event: T) => void) | null
}

export type ApplicationOptions = {
  resizeTo?: Resizeable
}

export class Application {
  private _renderer: GLRenderer
  private _shader!: Shader

  public constructor(options: ApplicationOptions) {
    this._renderer = new GLRenderer()

    this._subscribeToResize(options.resizeTo)
    this._resize()
  }

  public start(): void {
    this._renderer.gl.clearColor(0, 0, 0, 1)
    
    this._loadShaders()
    this._shader.use()

    this._loop(0)
  }

  private _subscribeToResize(target?: Resizeable): void {
    const canvas = this._renderer.canvas

    if (target !== undefined && canvas !== undefined) {
      target.onresize = (event) => {
        canvas.width = event.target.innerWidth
        canvas.height = event.target.innerHeight
      }
    }
  }

  private _resize(): void {
    const canvas = this._renderer.canvas

    if (canvas !== undefined) {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
  }

  private _loadShaders(): void {
    this._shader = new Shader(this._renderer, "test", vertexShaderSource, fragmentShaderSource)

  }

  private _loop(elapsed: number): void {
    this._renderer.gl.clear(this._renderer.gl.COLOR_BUFFER_BIT)

    requestAnimationFrame(this._loop.bind(this))
  }
}

