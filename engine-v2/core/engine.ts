import { AssetManager } from "./assets/asset-manager.ts"
import { GLRenderer } from "./gl/gl"
import { AttributeInfo, GlBuffer } from "./gl/glBuffer.ts"
import { Shader } from "./gl/shader"
import { Sprite } from "./graphics/sprite.ts"
import { Matrix4x4 } from "./math/matrix4x4.ts"
import { MessageBus } from "./message/message-bus.ts"
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
  private _shader!: Shader
  private _sprite!: Sprite
  private _renderer: GLRenderer
  private _projection!: Matrix4x4

  public constructor(options: ApplicationOptions) {
    this._renderer = new GLRenderer()

    this._subscribeToResize(options.resizeTo)
    this._resize()
  }

  public start(): void {
    this._renderer.gl.clearColor(0, 0, 0, 1)

    this._loadShaders()
    this._shader.use()

    const canvas = this._renderer.canvas
    AssetManager.init()

    this._projection = Matrix4x4.orthographic(0, canvas.width, 0, canvas.height, -100, 100)
    this._sprite = new Sprite(this._renderer, "test", "./engine-v2/assets/textures/crate.jpg")

    this._sprite.load()

    this._sprite.position.x = 200
    this._sprite.position.y = 200

    this._loop(0)
  }

  private _subscribeToResize(target?: Resizeable): void {
    const canvas = this._renderer.canvas

    if (target !== undefined && canvas !== undefined) {
      target.onresize = (event) => {
        canvas.width = event.target.innerWidth
        canvas.height = event.target.innerHeight

        this._renderer.gl.viewport(0, 0, canvas.width, canvas.height)
        this._projection = Matrix4x4.orthographic(0, canvas.width, 0, canvas.height, -100, 100)
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
    MessageBus.update(elapsed)

    const gl = this._renderer.gl

    gl.clear(gl.COLOR_BUFFER_BIT)

    const colorPosition = this._shader.getUniformLocation("u_tint")
    gl.uniform4f(colorPosition, 1, 1, 1, 1)

    const projectionPosition = this._shader.getUniformLocation("u_projection")
    gl.uniformMatrix4fv(projectionPosition, false, new Float32Array(this._projection.data))

    const modelLocation = this._shader.getUniformLocation("u_model")
    gl.uniformMatrix4fv(modelLocation, false, new Float32Array(
      Matrix4x4.translation(this._sprite.position).data
    ))

    this._sprite.draw(this._shader)

    requestAnimationFrame(this._loop.bind(this))
  }
}

