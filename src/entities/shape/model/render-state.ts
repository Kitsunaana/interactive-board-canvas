import type { Rect } from "@/shared/type/shared";
import { drawVectorPath, drawVectorRectangle } from "../lib/render/_drawer";
import { getBoundingBox } from "./get-bounding-box";
import type { ClientShape, RenderMode, Shape } from "./types";
import { addPoint, subtractPoint } from "@/shared/lib/point";

const renderShapeToBitmap = (shape: Shape, bbox: Rect) => {
  const canvas = document.createElement("canvas")
  const context = canvas.getContext("2d") as CanvasRenderingContext2D

  const QUALITY_SCALE = 4

  canvas.width = (bbox.width + 10) * QUALITY_SCALE
  canvas.height = (bbox.height + 10) * QUALITY_SCALE

  context.scale(QUALITY_SCALE, QUALITY_SCALE)

  if (shape.kind === "rectangle") drawVectorRectangle(context, shape)
  if (shape.kind === "pen") drawVectorPath(context, shape)

  return canvas
}

const getShapeWithTranslateToTopLeft = (shape: Shape): Shape => {
  switch (shape.kind) {
    case "rectangle": {
      return {
        ...shape,
        transform: {
          ...shape.transform,
          rotate: 0,
        },
        geometry: {
          ...shape.geometry,
          x: 5,
          y: 5,
          width: shape.geometry.width + 10,
          height: shape.geometry.height + 10,
        }
      }
    }
    case "pen": {
      const bbox = getBoundingBox(shape.geometry, 0)
      
      return {
        ...shape,
        transform: {
          ...shape.transform,
          rotate: 0,
        },
        geometry: {
          ...shape.geometry,
          points: shape.geometry.points.map((point) => addPoint(subtractPoint(bbox, point), 5))
        }
      }
    }

    case "ellipse":
    case "diamond":
    case "image":
    case "arrow":
    case "line":
      throw new Error(`This ${shape.kind} is not supported`)
  }
}

export const getShapeBitmap = async (shape: Shape) => {
  const shiftedShape = getShapeWithTranslateToTopLeft(shape)
  const bboxAfterShift = getBoundingBox(shiftedShape.geometry, 0)
  const canvas = renderShapeToBitmap(shiftedShape, bboxAfterShift)

  const bitmap = await createImageBitmap(canvas)

  return {
    bbox: getBoundingBox(shape.geometry, shape.transform.rotate),
    bitmap,
  }
}

export const ensureBitmap = (shape: ClientShape) => {
  const render = shape.client.renderMode

  if (render.kind !== "bitmap") return
  if (!render.dirty) return

  getShapeBitmap(shape).then(({ bitmap, bbox }) => {
    render.bitmap = bitmap
    render.dirty = false
    render.bbox = bbox
  })
}

export const markDirty = (shape: ClientShape) => {
  const render = shape.client.renderMode

  render.kind = "bitmap"
    ; (render as RenderMode & { kind: "bitmap" }).dirty = true
}

export const markDirtySelectedShapes = (shapes: ClientShape[]) => {
  return shapes.map((shape) => {
    if (shape.client.isSelected) markDirty(shape)

    return shape
  })
}