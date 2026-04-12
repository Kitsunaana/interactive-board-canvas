import { isNil } from "lodash";
import { GLRenderer } from "../gl/gl";
import { AttributeInfo, GlBuffer } from "../gl/glBuffer";
import { Vector3 } from "../math/vector3";
import { Texture } from "./texture";
import { TextureManager } from "./texture-manager";
import { Shader } from "../gl/shader";

export class Sprite {
  private _buffer: GlBuffer | null = null
  private _texture: Texture
  
  public position = new Vector3()

  public constructor(
    private _renderer: GLRenderer,
    private _name: string,
    private _textureName: string,
    private _width: number = 100,
    private _height: number = 100
  ) {
    this._texture = TextureManager.getTexture(this._renderer.gl!, this._textureName)
  }

  public get name(): string {
    return this._name
  }

  private get buffer(): GlBuffer {
    if (isNil(this._buffer)) {
      throw new Error("Sprite need load")
    }

    return this._buffer
  }

  public destroy(): void {
    this.buffer.destroy()
    TextureManager.releaseTexture(this._textureName)
  }

  public load(): void {
    this._buffer = new GlBuffer(this._renderer, 5)
    
    this._buffer.addAttributeLocation(new AttributeInfo(0, 0, 3))
    this._buffer.addAttributeLocation(new AttributeInfo(1, 3, 2))

    const vertices = [
      // x, y, z
      0, 0, 0, 0, 0,
      0, this._height, 0, 0, 1.0,
      this._width, this._height, 0, 1.0, 1.0,

      this._width, this._height, 0, 1.0, 1.0,
      this._width, 0, 0, 1.0, 0,
      0, 0, 0, 0, 0,
    ]

    this._buffer.pushBackData(vertices)
    this._buffer.unbind()
  }

  public update(time: number) {

  }

  public draw(shader: Shader): void {
    const gl = this._renderer.gl

    this._texture.activateAndBind(0)

    const diffuseLocation = shader.getUniformLocation("u_diffuse")
    gl.uniform1i(diffuseLocation, 0)

    this.buffer.bind()
    this.buffer.draw()
  }
}