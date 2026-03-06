import { AssetManager } from "./asset-manager";
import { Asset, AssetLoader } from "./asset.interface";

export class ImageAsset implements Asset {
  constructor(
    public readonly name: string,
    public readonly data: HTMLImageElement
  ) { }

  public get width(): number {
    return this.data.width
  }

  public get height(): number {
    return this.data.height
  }
}

export class ImageAssetLoader implements AssetLoader {
  public get supportedExtensions(): Array<string> {
    return ["png", "gif", "jpg", "jpeg"]
  }

  public loadAsset(assetName: string): void {
    const image = new Image()

    image.onload = this._onImageLoaded.bind(this, assetName, image)
    image.src = assetName
  }

  private _onImageLoaded(assetName: string, image: HTMLImageElement): void {
    const asset = new ImageAsset(assetName, image)
    AssetManager.onAssetLoaded(asset)
  }
}