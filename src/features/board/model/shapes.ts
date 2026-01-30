import { getShapeBitmap } from "@/entities/shape/model/render-state";
import type { ClientShape, Shape } from "@/entities/shape/model/types";
import { generateRandomColor } from "@/shared/lib/color";
import { nanoid } from "nanoid";
import * as rx from "rxjs";

export const initialShapes: Shape[] = [
  {
    id: nanoid(),
    sketch: false,
    kind: "rectangle",
    colorId: generateRandomColor(),
    style: {
      strokeColor: "#e03131",
      fillColor: "#ffc9c9",
      borderRadius: 25,
      lineWidth: 1,
      opacity: 0,
    },
    transform: {
      rotate: 5,
      scaleX: 1,
      scaleY: 1,
    },
    geometry: {
      kind: "rectangle-geometry",
      x: 400,
      y: 500,
      width: 300,
      height: 200,
    },
  },
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
      rotate: 0.2,
      scaleX: 1,
      scaleY: 1,
    },
    geometry: {
      kind: "rectangle-geometry",
      x: 500,
      y: 200,
      width: 300,
      height: 200,
    },
  }
]

const shapesToClient = async (shapes: Shape[]) => {
  return Promise.all(shapes.map(async (shape): Promise<ClientShape> => {
    const { bbox, bitmap } = await getShapeBitmap(shape)

    return {
      ...shape,
      client: {
        isSelected: false,
        renderMode: {
          kind: "bitmap",
          dirty: false,
          bitmap,
          bbox,
        }
      }
    }
  }))
}

export const shapes$ = new rx.BehaviorSubject<ClientShape[]>([])

rx.from(shapesToClient(initialShapes)).pipe(rx.tap({
  next: (shapes) => {
    shapes$.next(shapes)
  }
})).subscribe()
