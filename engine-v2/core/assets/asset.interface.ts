export interface Asset {
  readonly name: string
  readonly data: unknown
}

export interface AssetLoader {
  readonly supportedExtensions: Array<string>

  loadAsset(assetName: string): void
}