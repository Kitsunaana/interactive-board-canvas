import { getPointFromEvent, screenToCanvas } from "../../point"
import type { Rect } from "../../type"
import { getBoundingClientRect } from "../../utils"

export type MiniMapState = {
  context: CanvasRenderingContext2D | null
  canvas: HTMLCanvasElement | null
  canView: boolean
}

export type MiniMapStateReady = MiniMapState & {
  context: CanvasRenderingContext2D
  canvas: HTMLCanvasElement
}

export const scaleRect = (rect: Rect, scale: number): Rect => ({
  height: rect.height / scale,
  width: rect.width / scale,
  y: rect.y / scale,
  x: rect.x / scale,
})

export const getPointInMiniMap = (downEvent: PointerEvent) => {
  return screenToCanvas({
    camera: getBoundingClientRect(downEvent),
    point: getPointFromEvent(downEvent),
  })
}