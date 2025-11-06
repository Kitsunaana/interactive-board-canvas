import type { Point } from "../type"
import { StickerToDraw } from "./sticker"
import { nodesManager } from "./stickers"

type IdleViewState = {
  type: "idle",
  selectedIds: Set<string>
  mouseDown?:
  | (Point & {
    type: "overlay"
    isRightClick: boolean
  })
  | (Point & {
    type: "node"
    nodeId: string
    isDragging: boolean
  })
}

interface ViewModel {
  nodes: StickerToDraw[]
  canvas?: {
    onMouseMove?: (event: PointerEvent) => void
    onMouseUp?: (event: PointerEvent) => void
  }
}

class ViewModelContext implements ViewModel {
  private _state!: AbstractViewModelState

  public nodes = this._state?.nodes
  public canvas = this._state?.canvas

  constructor(state?: AbstractViewModelState) {
    if (state !== undefined) {
      this.transtionTo(state)
    }
  }

  public transtionTo(state: AbstractViewModelState) {
    this._state = state

    this.nodes = this._state.nodes
    this.canvas = this._state.canvas

    this._state.setContext(this)
  }
}

abstract class AbstractViewModelState implements ViewModel {
  public canvas: ViewModel["canvas"] = undefined
  public nodes: ViewModel["nodes"] = []

  protected context!: ViewModelContext

  public setContext(context: ViewModelContext) {
    this.context = context
  }
}

class IdleViewModel extends AbstractViewModelState {
  constructor(protected readonly state: IdleViewState) {
    super()
  }

  static goToIdle({ selectedIds, mouseDown }: Partial<Omit<IdleViewState, "type">> = {}) {
    return new IdleViewModel({
      selectedIds: selectedIds ?? new Set<string>(),
      type: "idle",
      mouseDown,
    })
  }

  public nodes: ViewModel["nodes"] = nodesManager.nodes.map(node => {
    return new StickerToDraw({
      ...node,
      onMouseDown: () => {
        console.log("on mouse down lalala")
      },
      onMouseUp: () => {
        console.log("on mouse up lalala")
      }
    })
  })

  public canvas: ViewModel["canvas"] = {
    onMouseMove: () => {

    },
    onMouseUp: () => {

    }
  }
}

const viewModelContext = new ViewModelContext(IdleViewModel.goToIdle())

export {
  viewModelContext
}

