import { Message } from "../message/message";
import { Asset, AssetLoader } from "./asset.interface";
import { ImageAssetLoader } from "./image-asset-loader";

export const MESSAGE_ASSET_LOADER_ASSET_LOADED = "MESSAGE_ASSET_LOADER_ASSET_LOADED::"

export class AssetManager {
  private static _loaders: AssetLoader[]
  private static _loadedAssets: Record<string, Asset> = {}

  private constructor() {}

  public static init(): void {
    AssetManager._loaders.push(new ImageAssetLoader())
  }

  public static registerLoader(loader: AssetLoader): void {
    AssetManager._loaders.push(loader)
  }

  public static onAssetLoaded(asset: Asset): void {
    AssetManager._loadedAssets[asset.name] = asset
    const code = `${MESSAGE_ASSET_LOADER_ASSET_LOADED}${asset.name}`
    
    Message.send(code, this, asset)
  }

  public static loadAsset(assetName: string): void {
    const extenstion = assetName.split(".").pop()?.toLowerCase()
    if (extenstion === undefined) return

    for (const loader of AssetManager._loaders) {
      if (loader.supportedExtensions.indexOf(extenstion) !== -1) {
        loader.loadAsset(assetName)
        return
      }
    }

    console.warn(
      `Unable to load asset with extension ${extenstion} because there is no loader associated with it`
    )
  }

  public static isAssetLoaded(assetName: string): boolean {
    return AssetManager._loadedAssets[assetName] !== undefined
  }

  public static getAsset(assetName: string): Asset | void {
    const loadedAsset = AssetManager._loadedAssets[assetName] 

    return loadedAsset
      ? loadedAsset
      : AssetManager.loadAsset(assetName)
  }
}