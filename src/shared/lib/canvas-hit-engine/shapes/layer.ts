export class Layer {
  private readonly _type = "Layer"

  private _canvas: HTMLCanvasElement

  public constructor() {
    const canvas = document.createElement("canvas")
    
    this._canvas = canvas
  }

  public getType() {
    return this._type
  }

  public clear() {
    
  }
}