import { match } from "@/shared/lib/match";
import { _u } from "@/shared/lib/utils";
import * as rx from "rxjs";

import type { ShapeToView } from "../domain/shape";
import { generateEllipseSketchProps, generateRectangleSketchProps } from "../view-model/shape-sketch";
import { shapes } from "./_assets";

export const shapes$ = new rx.BehaviorSubject(shapes)

export const shapesToView$ = shapes$.pipe(
  rx.map((shapes) => shapes.map((shape) => {
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
  })),
  rx.shareReplay({ refCount: true, bufferSize: 1 })
)