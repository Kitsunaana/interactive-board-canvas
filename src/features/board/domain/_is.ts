export const isBound = <T extends { id: string }>(candidate: T) => (
  candidate.id === "bottom" ||
  candidate.id === "right" ||
  candidate.id === "left" ||
  candidate.id === "top"
)

export const isShape = <T extends { type: string }>(candidate: T) => {
  return (
    candidate.type === "rectangle" ||
    candidate.type === "circle" ||
    candidate.type === "square"
  )
}

export const isCanvas = <T extends { type: string }>(candidate: T) => {
  return candidate.type === "grid"
}