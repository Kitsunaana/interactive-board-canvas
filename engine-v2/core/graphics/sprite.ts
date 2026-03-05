import { isNil } from "lodash";
import { GLRenderer } from "../gl/gl";
import { AttributeInfo, GlBuffer } from "../gl/glBuffer";
import { Vector3 } from "../math/vector3";

export class Sprite {
  private _buffer: GlBuffer | null = null
  
  public position = new Vector3()

  public constructor(
    private _renderer: GLRenderer,
    private _name: string,
    private _width: number = 100,
    private _height: number = 100
  ) {}

  private get buffer() {
    if (isNil(this._buffer)) {
      throw new Error("Sprite need load")
    }

    return this._buffer
  }

  public load(): void {
    this._buffer = new GlBuffer(this._renderer, 3)
    this._buffer.addAttributeLocation(new AttributeInfo(0, 0, 3))

    const vertices = [
      // x, y, z
      0, 0, 0,
      0, this._height, 0,
      this._width, this._height, 0,

      this._width, this._height, 0,
      this._width, 0, 0,
      0, 0, 0
    ]

    this._buffer.pushBackData(vertices)
    this._buffer.unbind()
  }

  public update(time: number) {

  }

  public draw(): void {
    this.buffer.bind()
    this.buffer.draw()
  }
}