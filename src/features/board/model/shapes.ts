import type { Shape } from "@/entities/shape/model/types";
import { generateRandomColor } from "@/shared/lib/color";
import { nanoid } from "nanoid";
import * as rx from "rxjs";

export const shapes: Shape[] = [
  {
    id: nanoid(),
    sketch: false,
    kind: "rectangle",
    colorId: generateRandomColor(),
    style: {
      strokeColor: "#2f9e44",
      fillColor: "#b2f2bb",
      borderRadius: 25,
      lineWidth: 1,
      opacity: 0,
    },
    transform: {
      rotate: 0,
      scaleX: 1,
      scaleY: 1,
    },
    geometry: {
      kind: "rectangle-geometry",
      x: 500,
      y: 200,
      width: 300,
      height: 200,
    }
  }
]



export const shapes$ = new rx.BehaviorSubject(shapes)