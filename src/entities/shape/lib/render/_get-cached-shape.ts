import { match } from "@/shared/lib/match"
import { generateSketchProps } from "@/shared/lib/sketch"
import { _u } from "@/shared/lib/utils"
import { isEqual, isUndefined, pick } from "lodash"
import type { Shape, ShapeToView } from "../../model/types"
import { getShapeBasePoints } from "./_generate-sketch-points"

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
    arrow: (arrow) => arrow,
    image: (image) => image,
    text: (text) => text,
    line: (line) => line,
    path: (path) => path,
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