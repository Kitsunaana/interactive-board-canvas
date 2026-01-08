import { getRandFromId } from "@/shared/lib/seed.ts";
import type { Rect } from "@/shared/type/shared.ts";
import { times } from "lodash";
import type { Camera } from "../modules/_camera";
import {
  generateHachureLines,
  generateLayerOffsets,
  generateSketchyOutline,
  getRectBasePoints
} from "../ui/sketch/generate-v2.ts";
import { CONFIG } from "../ui/sketch/sticker/config.ts";
import type { Rectangle } from "./shapes/rectangle.ts";

export const generateRectSketchProps = ({ id, ...rect }: Rectangle) => {
  const rand = getRandFromId(id)

  const basePoints = getRectBasePoints(rect.x, rect.y, rect.width, rect.height)
  const outlines = times(CONFIG.layers).map(() => generateSketchyOutline({
    basePoints,
    rand,
  }))

  const layerOffsets = generateLayerOffsets({ rand })
  const hachureLines = generateHachureLines({
    outlinePoints: outlines[0],
    offsetX: layerOffsets[0].x,
    offsetY: layerOffsets[0].y,
    rand,
  })

  return {
    outlines,
    layerOffsets,
    hachureFill: true,
    strokeColor: '#8b5cf6',
    hachureLines: hachureLines,
  }
}

export const PADDING = 7
export const BASE_RADIUS = 5
export const SCALE_POWER = 0.75

export const getActiveBoxDots = ({ rect, camera }: { camera: Camera, rect: Rect }) => [
  {
    radius: BASE_RADIUS / Math.pow(camera.scale, SCALE_POWER),
    x: rect.x - PADDING,
    y: rect.y - PADDING,
  },
  {
    radius: BASE_RADIUS / Math.pow(camera.scale, SCALE_POWER),
    x: rect.x + rect.width + PADDING,
    y: rect.y - PADDING,
  },
  {
    radius: BASE_RADIUS / Math.pow(camera.scale, SCALE_POWER),
    x: rect.x + rect.width + PADDING,
    y: rect.y + rect.height + PADDING,
  },
  {
    radius: BASE_RADIUS / Math.pow(camera.scale, SCALE_POWER),
    x: rect.x - PADDING,
    y: rect.y + rect.height + PADDING,
  },
]