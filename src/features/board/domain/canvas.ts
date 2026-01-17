export type CanvasGridSquare = {
  type: "square"
}

export type CanvasGridLines = {
  type: "lines"
}

export type CanvasGridDots = {
  type: "dots"
}

export type CanvasGridNone = {
  type: "none"
}

export type CanvasGridVariant =
  | CanvasGridSquare
  | CanvasGridLines
  | CanvasGridDots
  | CanvasGridNone