import { Message } from "../message/message"
import { AssetManager, MESSAGE_ASSET_LOADER_ASSET_LOADED } from "../assets/asset-manager"
import type { MessageHandler } from "../message/message-handler"
import { ImageAsset } from "../assets/image-asset-loader"

const LEVEL: number = 0
const BORDER: number = 0
const TEMP_IMAGE_DATA: Uint8Array = new Uint8Array([255, 255, 255, 255])

export class Texture implements MessageHandler {
  private _handle: WebGLTexture
  private _isLoaded: boolean = false

  public constructor(
    private _gl: WebGL2RenderingContext,
    private _name: string,
    private _width: number = 1,
    private _height: number = 1,
  ) {
    this._handle = _gl.createTexture()

    Message.subscribe(MESSAGE_ASSET_LOADER_ASSET_LOADED + this.name, this)

    this.bind()

    _gl.texImage2D(_gl.TEXTURE_2D, LEVEL, _gl.RGBA, 1, 1, BORDER, _gl.RGBA, _gl.UNSIGNED_BYTE, TEMP_IMAGE_DATA)

    const asset = AssetManager.getAsset(this.name)
    if (asset !== undefined) {
      this._loadTextureFromAsset(asset)
    }
  }

  public get name(): string {
    return this._name
  }

  public get isLoaded(): boolean {
    return this._isLoaded
  }

  public get width(): number {
    return this._width
  }

  public get height(): number {
    return this._height
  }

  public destroy(): void {
    this._gl.deleteTexture(this._handle)
  }

  public activateAndBind(textureUnit: number = 0): void {
    this._gl.activeTexture(this._gl.TEXTURE0 + textureUnit)

    this.bind()
  }

  public bind(): void {
    this._gl.bindTexture(this._gl.TEXTURE_2D, this._handle)
  }

  public unbind(): void {
    this._gl.bindTexture(this._gl.TEXTURE_2D, null)
  }

  public onMessage(message: Message): void {
    if (message.code === MESSAGE_ASSET_LOADER_ASSET_LOADED + this.name) {
      this._loadTextureFromAsset(message.context)
    }
  }

  private _loadTextureFromAsset(asset: ImageAsset): void {
    this._width = asset.width
    this._height = asset.height

    this.bind()

    const gl = this._gl

    gl.texImage2D(gl.TEXTURE_2D, LEVEL, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, asset.data)

    if (this._isPowerOf2()) {
      gl.generateMipmap(gl.TEXTURE_2D)
    } else {
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
    }

    this._isLoaded = true
  }

  private _isPowerOf2(): boolean {
    return (this._isValuePowerOf2(this.width) && this._isValuePowerOf2(this.height))
  }

  private _isValuePowerOf2(value: number): boolean {
    return (value & (value - 1)) === 0
  }
}