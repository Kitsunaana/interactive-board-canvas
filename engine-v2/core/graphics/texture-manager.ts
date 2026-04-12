import { Texture } from "./texture";

export class TextureReferenceNode {
  public texture: Texture
  public referenceCount: number = 1

  public constructor(texture: Texture) {
    this.texture = texture
  }
}

export class TextureManager {
  private static _textures: Record<string, TextureReferenceNode> = {}

  private constructor() {}

  public static getTexture(gl: WebGL2RenderingContext, textureName: string): Texture {
    if (TextureManager._textures[textureName] === undefined) {
      TextureManager._textures[textureName] = new TextureReferenceNode(new Texture(gl, textureName))
    } else {
      TextureManager._textures[textureName].referenceCount++
    }

    return TextureManager._textures[textureName].texture
  }

  public static releaseTexture(textureName: string): void {
    const referenceNode = TextureManager._textures[textureName] 
    
    if (referenceNode === undefined) {
      console.warn(`A texture named: ${textureName} does not exist therefore cannot be released`)
    } else {
      referenceNode.referenceCount--

      if (referenceNode.referenceCount < 1) {
        referenceNode.texture.destroy()

        delete TextureManager._textures[textureName]
      }

    }
  }
}