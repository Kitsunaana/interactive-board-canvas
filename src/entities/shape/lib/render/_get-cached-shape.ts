import { match } from "@/shared/lib/match"
import { generateSketchProps } from "@/shared/lib/sketch"
import { _u } from "@/shared/lib/utils"
import { isEqual, isUndefined, pick } from "lodash"
import type { Ellipse, Shape, ShapeToView } from "../../model/types"
import { drawShape, drawSketchEllipse } from "./_drawer"
import { getEllipleBasePoints, getShapeBasePoints } from "./_generate-sketch-points"

const CacheShapes = new Map<string, ShapeToView>()

const addSketchPropertiesToShape = (shape: Shape) => {
  return match(shape, {
    rectangle: (shape) => !shape.sketch ? shape : _u.merge(shape, generateSketchProps({
      basePoints: getShapeBasePoints(shape),
      rect: shape,
    })),

    ellipse: (shape) => !shape.sketch ? shape : _u.merge(shape, generateSketchProps({
      basePoints: getShapeBasePoints(shape),
      rect: {
        height: shape.height,
        width: shape.width,
        id: shape.id,
        x: shape.x,
        y: shape.y,
      }
    })),

    rhombus: (rhombus) => rhombus,
  }) as ShapeToView
}

const watchShapeProps: Record<string, string[]> = {
  rectangle: ["angle", "borderRadius", "height", "width", "x", "y"],
  rhombus: ["angle", "borderRadius", "height", "width", "x", "y"],
  image: ["angle", "borderRadius", "height", "width", "x", "y"],
  ellipse: ["angle", "rx", "ry", "x", "y"],

  arrow: [],
  line: [],
  path: [],
  text: [],
}


export const getShapeToViewFromCache = (shape: Shape) => {
  if (isUndefined(CacheShapes.get(shape.id))) CacheShapes.set(shape.id, addSketchPropertiesToShape(shape))
  const readFromCache = CacheShapes.get(shape.id) as ShapeToView

  if (isEqual(pick(shape, watchShapeProps[shape.type]), pick(readFromCache, watchShapeProps[shape.type]))) {
    return readFromCache
  }

  const updatedShape = addSketchPropertiesToShape(shape)
  CacheShapes.set(shape.id, updatedShape)

  return updatedShape
}

export const CacheBitmapShape = new Map<string, ImageBitmap>()

export async function getShapeBitmap(shape: ShapeToView) {
  const cached = CacheBitmapShape.get(shape.id)
  if (cached) return cached

  const localEllipse = {
    ...shape,
    x: 5,
    y: 5,
  } as any

  const bitmap = await createImageBitmap(
    renderShapeToBitmap(shape, (context) => {
      drawSketchEllipse(context, {
        ...localEllipse,
        ...generateSketchProps({
          basePoints: getEllipleBasePoints(localEllipse),
          rect: localEllipse,
        })
      } as any)
    })
  )

  CacheBitmapShape.set(shape.id, bitmap)
  return bitmap
}

function renderShapeToBitmap(shape: ShapeToView, draw: (context: CanvasRenderingContext2D) => void) {
  const canvas = document.createElement("canvas")
  const context = canvas.getContext("2d") as CanvasRenderingContext2D

  const QUALITY_SCALE = 3

  canvas.width = (shape.width + 10) * QUALITY_SCALE
  canvas.height = (shape.height + 10) * QUALITY_SCALE

  context.scale(QUALITY_SCALE, QUALITY_SCALE)

  draw(context)

  return canvas
}