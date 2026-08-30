import { Group } from "../Group";

const KEYBOARD = {
  ESCAPE: "Escape"
}

export class CubicBezierPath extends Group {

}

export class CubicBezierPathManager extends Group {
  private _currentShapeIndex: number | null = null
  private _isDrawingMode: boolean = false

  public constructor() {
    super()

    this.on("addToParent", this._initialize.bind(this))
  }

  private _initialize() {
    const layer = this.getLayerOrThrow()

    layer.on("pointerdown", () => {
      this._isDrawingMode = true
      this._currentShapeIndex = 0

      const path = new CubicBezierPath()
    })

    window.addEventListener("keydown", (event) => {
      if (event.code === KEYBOARD.ESCAPE) {
        this._isDrawingMode = false
        this._currentShapeIndex = null
      }
    })
  }
}