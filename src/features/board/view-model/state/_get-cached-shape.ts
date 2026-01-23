import { match } from "@/shared/lib/match"
import { _u } from "@/shared/lib/utils"
import { isEqual, isUndefined, pick } from "lodash"
import type { Shape, ShapeToView } from "../../domain/shape"
import { generateEllipseSketchProps, generateRectangleSketchProps } from "../shape-sketch"

const CacheShapes = new Map<string, ShapeToView>()

const watchProps: (keyof ShapeToView)[] = ["x", "y", "width", "height"]

const addSketchPropertiesToShape = (shape: Shape) => {
  return match(shape, {
    rectangle: (shape) => shape.sketch ? _u.merge(shape, generateRectangleSketchProps(shape)) : shape,
    circle: (shape) => shape.sketch ? _u.merge(shape, generateEllipseSketchProps(shape)) : shape,
    square: (square) => square,
    arrow: (arrow) => arrow,
  }) as ShapeToView
}

export const getCachedShapeToView = (shape: Shape) => {
  if (isUndefined(CacheShapes.get(shape.id))) CacheShapes.set(shape.id, addSketchPropertiesToShape(shape))
  const readFromCache = CacheShapes.get(shape.id) as ShapeToView

  if (isEqual(pick(shape, watchProps), pick(readFromCache, watchProps))) {
    return readFromCache
  }

  const updatedShape = addSketchPropertiesToShape(shape)
  CacheShapes.set(shape.id, updatedShape)

  return updatedShape
}