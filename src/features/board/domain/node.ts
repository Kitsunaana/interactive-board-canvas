import { match } from "@/shared/lib/match";
import { _u } from "@/shared/lib/utils";
import { BehaviorSubject, map } from "rxjs";
import { shapes } from "./_assets";
import type { ArrowToView, CircleToView, ShapeToView, SquareToView } from "./dto";
import type { RectangleToView } from "./shapes/rectangle";
import { generateRectSketchProps } from "./sticker";

export const shapes$ = new BehaviorSubject(shapes)

export const shapesToView$ = shapes$.pipe(map((shapes) => {
  return shapes.map((shape): ShapeToView => {
    return match(shape, {
      arrow: (arrow): ArrowToView => arrow,
      circle: (circle): CircleToView => circle,
      square: (square): SquareToView => square,
      rectangle: (rectangle): RectangleToView => {
        if (rectangle.sketch) return _u.merge(rectangle, generateRectSketchProps(rectangle))

        return {
          ...rectangle,
          sketch: false
        }
      },
    })
  })
}))