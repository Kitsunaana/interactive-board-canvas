import { BehaviorSubject } from "rxjs"

export type IdleViewState = {
  selectedIds: Set<string>
  type: "idle"
}

export const viewModelState$ = new BehaviorSubject<IdleViewState>({
  selectedIds: new Set(),
  type: "idle",
})

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