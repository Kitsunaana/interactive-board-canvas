import { AssetManager } from "./assets/asset-manager.ts"
import { GLRenderer } from "./gl/gl"
import { Shader } from "./gl/shader"
import { BasicShader } from "./gl/shaders/basic-shader.ts"
import { Color } from "./graphics/color.ts"
import { MaterialManager } from "./graphics/material-manager.ts"
import { Material } from "./graphics/material.ts"
import { Sprite } from "./graphics/sprite.ts"
import { Matrix4x4 } from "./math/matrix4x4.ts"
import { MessageBus } from "./message/message-bus.ts"

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
  private _sprite!: Sprite
  private _renderer: GLRenderer
  private _projection!: Matrix4x4
  private _basicShader!: BasicShader

  public constructor(options: ApplicationOptions) {
    this._renderer = new GLRenderer()

    this._subscribeToResize(options.resizeTo)
    this._resize()
  }

  public start(): void {
    this._renderer.gl.clearColor(0, 0, 0, 1)

    this._basicShader = new BasicShader(this._renderer)
    this._basicShader.use()

    const canvas = this._renderer.canvas
    AssetManager.init()

    MaterialManager.registerMaterial(
      new Material(
        this._renderer.gl,
        "crate",
        "./engine-v2/assets/textures/crate.jpg",
        new Color(255, 128, 0, 255)
      )
    )

    this._projection = Matrix4x4.orthographic(0, canvas.width, 0, canvas.height, -100, 100)
    this._sprite = new Sprite(this._renderer, "test", "crate")

    this._sprite.load()

    this._sprite.position.x = 200
    this._sprite.position.y = 200

    this._loop(0)
  }

  private _updateGlViewport(canvas: HTMLCanvasElement) {
    this._renderer.gl.viewport(0, 0, canvas.width, canvas.height)
    this._projection = Matrix4x4.orthographic(0, canvas.width, 0, canvas.height, -100, 100)
  }

  private _subscribeToResize(target?: Resizeable): void {
    const canvas = this._renderer.canvas

    if (target !== undefined && canvas !== undefined) {
      target.onresize = (event) => {
        canvas.width = event.target.innerWidth
        canvas.height = event.target.innerHeight

        this._updateGlViewport(canvas)
      }
    }
  }

  private _resize(): void {
    const canvas = this._renderer.canvas

    if (canvas !== undefined) {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight

      this._updateGlViewport(canvas)
    }
  }

  private _loop(elapsed: number): void {
    MessageBus.update(elapsed)

    const gl = this._renderer.gl

    gl.clear(gl.COLOR_BUFFER_BIT)

    const projectionPosition = this._basicShader.getUniformLocation("u_projection")
    gl.uniformMatrix4fv(projectionPosition, false, new Float32Array(this._projection.data))

    this._sprite.draw(this._basicShader)

    requestAnimationFrame(this._loop.bind(this))
  }
}

