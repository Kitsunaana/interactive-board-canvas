import type { IdleViewState } from "../type.ts";

export type SelectionModifier = "replace" | "add" | "toggle"
export type Selection = Set<string>

export const selectItems = ({ ids, modif, initialSelected }: {
  initialSelected: Selection
  modif: SelectionModifier
  ids: string[]
}) => {
  if (modif === "replace") return new Set(ids)

  if (modif === "add") return new Set([...initialSelected, ...ids])

  if (modif === "toggle") {
    const newIds = new Set(ids)

    const base = Array.from(initialSelected).filter((id) => !newIds.has(id))
    const added = ids.filter((id) => !initialSelected.has(id))

    return new Set(base.concat(added))
  }

  return initialSelected
}

export const moveSelectedNodes = ({ camera, nodes, point, event, selectedIds }: {
  selectedIds: Set<string>
  event: PointerEvent
  camera: Camera
  nodes: Node[]
  point: Point
}) => {
  const pointerMoveWorldPoint = screenToCanvas({
    point: getPointFromEvent(event),
    camera,
  })

  return nodes.map((node) => (
    selectedIds.has(node.id)
      ? _u.merge(node, addPoint(node, subtractPoint(point, pointerMoveWorldPoint)))
      : node
  ))
}

export const stickerSelection = ({ event, node, idleState }: {
  idleState: IdleViewState
  event: PointerEvent
  node: StickerToView
}): IdleViewState => {
  if (idleState.selectedIds.has(node.id) && !event.ctrlKey) return idleState

  return {
    ...idleState,
    selectedIds: selectItems({
      modif: event.ctrlKey ? "toggle" : "replace",
      initialSelected: idleState.selectedIds,
      ids: [node.id],
    })
  }
}