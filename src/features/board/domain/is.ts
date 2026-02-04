export const isCanvas = <T extends { type: string }>(candidate: T) => {
  return candidate.type === "grid"
}