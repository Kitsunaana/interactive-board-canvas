import { StickerToDraw } from "./sticker"

export interface ViewModel {
  nodes: StickerToDraw[]
  canvas?: {
    onMouseMove?: (event: PointerEvent) => void
    onMouseUp?: (event: PointerEvent) => void
  }
}

export abstract class SetableViewModelContext implements ViewModel {
  public canvas: ViewModel["canvas"] = undefined
  public nodes: ViewModel["nodes"] = []

  protected context!: ViewModelContext

  public setContext(context: ViewModelContext) {
    this.context = context
  }
}

export class ViewModelContext implements ViewModel {
  private _state!: SetableViewModelContext

  public nodes = this._state?.nodes
  public canvas = this._state?.canvas

  constructor(state?: SetableViewModelContext) {
    if (state !== undefined) {
      this.transtionTo(state)
    }
  }

  public transtionTo(state: SetableViewModelContext) {
    this._state = state

    this.nodes = this._state.nodes
    this.canvas = this._state.canvas

    this._state.setContext(this)
  }
}


