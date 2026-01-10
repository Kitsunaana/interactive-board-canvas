export type BoundVariant = "top" | "right" | "bottom" | "left"

export type Bound = {
  id: BoundVariant
  type: "bound"
}

export type SelectionModifier = "replace" | "add" | "toggle"
export type Selection = Set<string>
