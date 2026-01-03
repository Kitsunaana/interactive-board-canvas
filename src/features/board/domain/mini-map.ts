import type {Rect} from "../../../shared/type/shared.ts";
import {getPointFromEvent, screenToCanvas} from "../../../shared/lib/point.ts";
import {getBoundingClientRect} from "../../../shared/lib/utils.ts";

export type MiniMapState = {
  context: CanvasRenderingContext2D | null
  canvas: HTMLCanvasElement | null
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