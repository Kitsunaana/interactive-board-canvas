import { GLRenderer } from "./gl"

export class AttributeInfo {
  public constructor(public location: number, public offset: number, public size: number) {}
}

export class GlBuffer {
  private _hasAttributeLocation: boolean = false

  private _buffer: WebGLBuffer
  private _typeSize: number
  private _stride: number

  private _data: Array<number> = []
  private _attributes: Array<AttributeInfo> = []

  public constructor(
    private readonly _elementSize: number,
    private readonly _dataType: number = 5126,
    private readonly _targetBufferType: number = 34962,
    private readonly _mode: number = 4
  ) {
    const gl = GLRenderer.gl

    switch (this._dataType) {
      case gl.INT:
      case gl.FLOAT:
      case gl.UNSIGNED_INT:
        this._typeSize = 4
        break
      case gl.SHORT:
      case gl.UNSIGNED_SHORT:
        this._typeSize = 2
        break
      case gl.BYTE:
      case gl.UNSIGNED_BYTE:
        this._typeSize = 1
        break
      default:
        throw new Error(`Unrecognize data type: ${this._dataType}`)
    }

    this._stride = this._elementSize * this._typeSize
    this._buffer = gl.createBuffer()
  }

  public destroy(): void {
    GLRenderer.gl.deleteBuffer(this._buffer)
  }

  public bind(normalized: boolean = false): void {
    const gl = GLRenderer.gl

    gl.bindBuffer(this._targetBufferType, this._buffer)

    if (this._hasAttributeLocation) {
      for (let attribute of this._attributes) {
        gl.vertexAttribPointer(
          attribute.location,
          attribute.size,
          this._dataType,
          normalized,
          this._stride,
          attribute.offset * this._typeSize
        )

        gl.enableVertexAttribArray(attribute.location)
      }
    }
  }

  public unbind(): void {
    const gl = GLRenderer.gl

    for (let attribute of this._attributes) {
      gl.disableVertexAttribArray(attribute.location)
    }

    gl.bindBuffer(this._targetBufferType, null)
  }

  public addAttributeLocation(info: AttributeInfo): void {
    this._hasAttributeLocation = true
    this._attributes.push(info)
  }

  public pushBackData(data: Array<number>): void {
    const gl = GLRenderer.gl

    this._data.push(...data)

    gl.bindBuffer(this._targetBufferType, this._buffer)

    let bufferData: ArrayBufferView

    switch (this._dataType) {
      case gl.INT:
        bufferData = new Int32Array(this._data)
        break

      case gl.FLOAT:
        bufferData = new Float32Array(this._data)
        break

      case gl.UNSIGNED_INT:
        bufferData = new Uint32Array(this._data)
        break

      case gl.SHORT:
        bufferData = new Int16Array(this._data)
        break

      case gl.UNSIGNED_SHORT:
        bufferData = new Uint16Array(this._data)
        break

      case gl.BYTE:
        bufferData = new Int8Array(this._data)
        break

      case gl.UNSIGNED_BYTE:
        bufferData = new Uint8Array(this._data)
        break

      default:
        throw new Error("unknown data type")
    }

    gl.bufferData(this._targetBufferType, bufferData, gl.STATIC_DRAW)
  }

  public draw(): void {
    const gl = GLRenderer.gl

    if (this._targetBufferType === gl.ARRAY_BUFFER) {
      gl.drawArrays(this._mode, 0, this._data.length / this._elementSize)
      return
    }

    if (this._targetBufferType === gl.ELEMENT_ARRAY_BUFFER) {
      gl.drawElements(this._mode, this._data.length, this._dataType, 0)
      return
    }
  }
}