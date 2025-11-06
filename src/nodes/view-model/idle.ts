import type { Point } from "../../type"
import { StickerToDraw } from "../sticker"
import { nodesManager } from "../stickers"
import { SetableViewModelContext, type ViewModel } from "../system"

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

export type SelectionModifier = "replace" | "add" | "toggle"
export type Selection = Set<string>

export const selectionItems = ({ ids, initialSelected, modifier }: {
  ids: string[]
  initialSelected: Selection
  modifier: SelectionModifier
}) => {
  if (modifier === "replace") {
    return new Set(ids)
  }

  if (modifier === "add") {
    return new Set([...initialSelected, ...ids])
  }

  if (modifier === "toggle") {
    const newIds = new Set(ids)

    const base = Array.from(initialSelected).filter(id => !newIds.has(id))
    const added = ids.filter(id => !initialSelected.has(id))

    return new Set(base.concat(added))
  }

  return initialSelected
}

const selection = {
  isSelected: (idleState: IdleViewState, nodeId: string) => {
    return idleState.selectedIds.has(nodeId)
  },

  select: (idleState: IdleViewState, ids: string[], modifier: SelectionModifier) => {
    return selectionItems({
      initialSelected: idleState.selectedIds,
      modifier,
      ids,
    })
  },

  handleNodeClick: (idleState: IdleViewState, event: PointerEvent, nodeId: string) => {
    const modifier: SelectionModifier = event.shiftKey || event.ctrlKey ? "toggle" : "replace"

    selection.select(idleState, [nodeId], modifier)
  }
}

export class IdleViewModel extends SetableViewModelContext {
  constructor(protected state: IdleViewState) {
    super()
  }

  static goToIdle({ selectedIds, mouseDown }: Partial<Omit<IdleViewState, "type">> = {}) {
    return new IdleViewModel({
      selectedIds: selectedIds ?? new Set<string>(),
      type: "idle",
      mouseDown,
    })
  }

  private _handleNodeClick({ event, nodeId }: {
    event: PointerEvent
    nodeId: string
  }) {
    const modifier: SelectionModifier = event.shiftKey || event.ctrlKey ? "toggle" : "replace"

    this._select({ ids: [nodeId], modifier })

    this.nodes.forEach(node => {
      node.sticker.isSelected = this._isSelected(node.sticker.id)
    })
  }

  private _isSelected(nodeId: string) {
    return this.state.selectedIds.has(nodeId)
  }

  private _select({ ids, modifier }: {
    ids: string[]
    modifier: SelectionModifier
  }) {
    this.state.selectedIds = selectionItems({
      initialSelected: this.state.selectedIds,
      modifier,
      ids,
    })
  }

  public nodes: ViewModel["nodes"] = nodesManager.nodes.map((node) => {
    const stickerToDraw = new StickerToDraw(node)

    stickerToDraw.onMouseDown = () => {
    }

    stickerToDraw.onMouseUp = (event) => {
      this._handleNodeClick({
        nodeId: node.id,
        event,
      })
    }

    return stickerToDraw
  })

  public canvas: ViewModel["canvas"] = {
    onMouseMove: () => {

    },
    onMouseUp: () => {

    }
  }
}