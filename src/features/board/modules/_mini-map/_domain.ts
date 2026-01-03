import { getPointFromEvent, screenToCanvas } from "@/shared/lib/point"
import { getBoundingClientRect } from "@/shared/lib/utils"

export type MiniMapState = {
  context: CanvasRenderingContext2D | null
  canvas: HTMLCanvasElement | null
}

export type MiniMapStateReady = MiniMapState & {
  context: CanvasRenderingContext2D
  canvas: HTMLCanvasElement
}

export const getPointInMiniMap = (downEvent: PointerEvent) => {
  return screenToCanvas({
    camera: getBoundingClientRect(downEvent),
    point: getPointFromEvent(downEvent),
  })
}