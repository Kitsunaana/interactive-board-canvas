import { match } from "@/shared/lib/match";
import { _u } from "@/shared/lib/utils";
import { BehaviorSubject, map } from "rxjs";
import { shapes } from "./_assets";
import type { ShapeToView } from "./dto";
import { generateEllipseSketchProps, generateRectangleSketchProps } from "./sticker";

export const shapes$ = new BehaviorSubject(shapes)

export const shapesToView$ = shapes$.pipe(map((shapes) => {
  return shapes.map((shape) => {
    return match(shape, {
      arrow: (arrow) => arrow,
      square: (square) => square,

      circle: (shape) => shape.sketch
        ? _u.merge(shape, generateEllipseSketchProps(shape))
        : shape,

      rectangle: (shape) => shape.sketch
        ? _u.merge(shape, generateRectangleSketchProps(shape))
        : shape,
    }) as ShapeToView
  })
}))