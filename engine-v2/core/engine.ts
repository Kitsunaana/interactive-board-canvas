import { GLRenderer } from "./gl/gl"
import { AttributeInfo, GlBuffer } from "./gl/glBuffer.ts"
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

  private _buffer!: GlBuffer

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

  private _loop(elapsed: number): void {
    const gl = this._renderer.gl

    gl.clear(gl.COLOR_BUFFER_BIT)

    const colorPosition = this._shader.getUniformLocation("u_color")
    gl.uniform4f(colorPosition, 1, 0, 0, 1)

    this._buffer.bind()
    this._buffer.draw()

    requestAnimationFrame(this._loop.bind(this))
  }

  private _createBuffer(): void {
    this._buffer = new GlBuffer(this._renderer, 3)

    const positionAttribute = new AttributeInfo()
    positionAttribute.location = this._shader.getAttributeLocation("a_position")
    positionAttribute.offset = 0
    positionAttribute.size = 3

    this._buffer.addAttributeLocation(positionAttribute)

    const vertices = [
      // x, y, z
      0.0, 0.0, 0.0,
      0.5, 1, 0.0,
      0.5, -1, 0.0,
    ]

    this._buffer.pushBackData(vertices)
    this._buffer.unbind()
  }
}

