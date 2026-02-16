export interface RotateTransformerController {
  draw(context: CanvasRenderingContext2D): void
  start(): void
}

export interface RotateTransformerModel {
  startRotate(event: PointerEvent): void
  finishRotate(event: PointerEvent): void
  processRotate(event: PointerEvent): void

  canStartRotate(event: PointerEvent): void
}

export type RotaterRect = {
  radius: number
  x: number
  y: number
}