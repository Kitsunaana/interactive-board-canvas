import { match } from "@/shared/lib/match";
import { _u } from "@/shared/lib/utils";
import * as rx from "rxjs"

import type { ShapeToView } from "../domain";
import { generateEllipseSketchProps, generateRectangleSketchProps } from "../view-model/sticker";
import { shapes } from "./_assets";

export const shapes$ = new rx.BehaviorSubject(shapes)

export const shapesToView$ = shapes$.pipe(rx.map((shapes) => {
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