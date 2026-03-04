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

  private _buffer!: WebGLBuffer

  public constructor(options: ApplicationOptions) {
    this._renderer = new GLRenderer()

    this._subscribeToResize(options.resizeTo)
    this._resize()
  }

  public start(): void {
    this._renderer.gl.clearColor(0, 0, 0, 1)

    this._loadShaders()
    this._shader.use()
    this._createBuffer()

    this._loop(0)
  }

  private _subscribeToResize(target?: Resizeable): void {
    const canvas = this._renderer.canvas

    if (target !== undefined && canvas !== undefined) {
      target.onresize = (event) => {
        canvas.width = event.target.innerWidth
        canvas.height = event.target.innerHeight

        this._renderer.gl.viewport(0, 0, canvas.width, canvas.height)
      }
    }
  }

  private _resize(): void {
    const canvas = this._renderer.canvas

    if (canvas !== undefined) {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight

      this._renderer.gl.viewport(0, 0, canvas.width, canvas.height)
    }
  }

  private _loadShaders(): void {
    this._shader = new Shader(this._renderer, "test", vertexShaderSource, fragmentShaderSource)
  }

  private _createBuffer(): void {
    const gl = this._renderer.gl

    this._buffer = gl.createBuffer()

    const vertices = [
      // x, y, z
      0.0, 0.0, 0.0,
      0.5, 1, 0.0,
      0.5, -1, 0.0,
    ]

    gl.bindBuffer(gl.ARRAY_BUFFER, this._buffer)
    // gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0)
    // gl.enableVertexAttribArray(0)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW)

    gl.bindBuffer(gl.ARRAY_BUFFER, null)
    gl.disableVertexAttribArray(0)
  }

  private _loop(elapsed: number): void {
    const gl = this._renderer.gl

    gl.clear(this._renderer.gl.COLOR_BUFFER_BIT)
    gl.bindBuffer(gl.ARRAY_BUFFER, this._buffer)
    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0)
    gl.enableVertexAttribArray(0)
    gl.drawArrays(gl.TRIANGLES, 0, 3)


    requestAnimationFrame(this._loop.bind(this))
  }
}

