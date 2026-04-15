import { AssetManager } from "./asset-manager";
import type { Asset, AssetLoader } from "./asset.interface";

export class JsonAsset implements Asset {
  constructor(public readonly name: string, public readonly data: any) { }
}

export class JsonAssetLoader implements AssetLoader {
  public get supportedExtensions(): Array<string> {
    return ["json"]
  }

  public loadAsset(assetName: string): void {
    const request = new XMLHttpRequest()

    request.open("GET", assetName)
    request.onload = this._onJsonLoaded.bind(this, assetName, request)
    request.send()
  }

  private _onJsonLoaded(assetName: string, request: XMLHttpRequest): any {
    if (request.readyState === request.DONE) {
      try {
        const parsed = JSON.parse(request.responseText)
        const asset = new JsonAsset(assetName, parsed)
        
        AssetManager.onAssetLoaded(asset)
      } catch (error) {
        console.log(error)
      }
    }
  }
}