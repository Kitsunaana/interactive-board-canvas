import { Texture } from "./texture";
import { Color } from "./color"
import { TextureManager } from "./texture-manager";
import { GLRenderer } from "../gl/gl";

export class Material {
  private _diffuseTexture: Texture | undefined

  public constructor(
    private _name: string,
    private _diffuseTextureName: string,
    private _tint: Color
  ) {
    this._diffuseTexture = TextureManager.getTexture(GLRenderer.gl, this._diffuseTextureName)
  }

  public get name(): string {
    return this._name
  }

  public get tint(): Color {
    return this._tint
  }

  public get diffuseTextureName(): string {
    return this._diffuseTextureName
  }

  public get diffuseTexture(): Texture | undefined {
    return this._diffuseTexture
  } 

  public set diffuseTextureName(value: string) {
    if (this._diffuseTexture !== undefined) {
      TextureManager.releaseTexture(this._diffuseTextureName)
    }

    this._diffuseTextureName = value
    this._diffuseTexture = TextureManager.getTexture(GLRenderer.gl, this._diffuseTextureName)
  }

  public destory(): void {
    TextureManager.releaseTexture(this.diffuseTextureName)
    this._diffuseTexture = undefined
  }
}