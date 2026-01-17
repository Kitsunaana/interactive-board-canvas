
export type EdgeVariant = "top" | "right" | "bottom" | "left"

export type Edge = {
  id: EdgeVariant
  type: "bound"
}

export type SelectionModifier = "replace" | "add" | "toggle"
export type Selection = Set<string>
