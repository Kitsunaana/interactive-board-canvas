import { getRandFromId } from "@/shared/lib/seed.ts";
import type { Point, Rect } from "@/shared/type/shared.ts";
import { times } from "lodash";
import type { Camera } from "../modules/_camera";
import {
  generateHachureLines,
  generateLayerOffsets,
  generateSketchyOutline,
  getEllipseBasePoints,
  getRectangleBasePoints
} from "../ui/sketch/generate-v2.ts";
import { CONFIG } from "../ui/sketch/sticker/config.ts";
import type { Rectangle } from "./shapes/rectangle.ts";
import type { Circle } from "./shapes/circle.ts";

export const generateSketchProps = <T extends Rect & { id: string }>({ rect, basePoints }: {
  basePoints: Point[]
  rect: T
}) => {
  const rand = getRandFromId(rect.id)

  const outlines = times(CONFIG.layers).map(() => generateSketchyOutline({ basePoints, rand }))

  const layerOffsets = generateLayerOffsets({ rand })
  const hachureLines = generateHachureLines({
    outlinePoints: outlines[0],
    offsetX: layerOffsets[0].x,
    offsetY: layerOffsets[0].y,
    rand,
  })

  return {
    hachureLines,
    layerOffsets,
    outlines,
  }
}

export const generateRectangleSketchProps = (shape: Rectangle) => ({
  hachureFill: true,
  strokeColor: '#8b5cf6',
  ...generateSketchProps({
    basePoints: getRectangleBasePoints(shape.x, shape.y, shape.width, shape.height),
    rect: shape
  })
})

export const generateEllipseSketchProps = ({ id, ...rect }: Circle) => {
  const radiusY = rect.height / 2
  const radiusX = rect.width / 2

  return {
    hachureFill: true,
    strokeColor: '#df3182ff',
    ...generateSketchProps({
      basePoints: getEllipseBasePoints(rect.x + radiusX, rect.y + radiusY, radiusX, radiusY),
      rect: { ...rect, id }
    })
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