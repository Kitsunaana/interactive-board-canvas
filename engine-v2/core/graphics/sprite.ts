import { isNil } from "lodash";
import { GLRenderer } from "../gl/gl";
import { AttributeInfo, GlBuffer } from "../gl/glBuffer";
import { Vector3 } from "../math/vector3";
import { Texture } from "./texture";
import { TextureManager } from "./texture-manager";
import { Shader } from "../gl/shader";
import { Matrix4x4 } from "../math/matrix4x4";
import { Material } from "./material";
import { MaterialManager } from "./material-manager";

export class Sprite {
  private _buffer: GlBuffer | null = null
  private _material: Material | undefined

  public position = new Vector3()

  public constructor(
    private _renderer: GLRenderer,
    private _name: string,
    private _materialName: string,
    private _width: number = 100,
    private _height: number = 100
  ) {
    this._material = MaterialManager.getMaterial(this._materialName)
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
    MaterialManager.releaseMaterial(this._materialName)
    this._material = undefined
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

    const modelLocation = shader.getUniformLocation("u_model")
    gl.uniformMatrix4fv(modelLocation, false, new Float32Array(Matrix4x4.translation(this.position).data))

    if (this._material !== undefined) {
      const colorLocation = shader.getUniformLocation("u_tint")
      gl.uniform4fv(colorLocation, this._material.tint.toFloat32Array())

      if (this._material.diffuseTexture !== undefined) {
        this._material.diffuseTexture?.activateAndBind(0)

        const diffuseLocation = shader.getUniformLocation("u_diffuse")
        gl.uniform1i(diffuseLocation, 0)
      }
    }

    this.buffer.bind()
    this.buffer.draw()
  }
}