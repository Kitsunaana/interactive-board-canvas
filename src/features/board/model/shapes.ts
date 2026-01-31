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
  },
  {
    id: nanoid(),
    kind: "pen",
    sketch: false,
    colorId: generateRandomColor(),
    style: {
      opacity: 0,
      lineWidth: 3,
      fill: "#a5d8ff",
      strokeColor: "#1971c2",
    },
    transform: {
      scaleX: 1,
      scaleY: 1,
      rotate: 0.4,
    },
    geometry: {
      kind: "path-geometry",
      points: [
        // { x: 100, y: 100 },
        // { x: 100, y: 200 },
        // { x: 300, y: 200 },
        // { x: 100, y: 100 },
        { x: 63, y: 167 },
        { x: 231, y: 106 },
        { x: 513, y: 172 },
        { x: 500, y: 219 },
        { x: 586, y: 229 },
        { x: 593, y: 148 },
        { x: 539, y: 100 },
        { x: 583, y: 71 },
        { x: 63, y: 167 },
        {
          "x": 639,
          "y": 117
        },
        {
          "x": 675,
          "y": 191
        },
        {
          "x": 640,
          "y": 233
        },
        {
          "x": 600,
          "y": 308
        },
        {
          "x": 626,
          "y": 351
        },
        {
          "x": 656,
          "y": 393
        },
        {
          "x": 582,
          "y": 412
        },
        {
          "x": 500,
          "y": 389
        },
        {
          "x": 481,
          "y": 342
        },
        {
          "x": 467,
          "y": 317
        },
        {
          "x": 448,
          "y": 271
        },
        {
          "x": 429,
          "y": 252
        },
        {
          "x": 408,
          "y": 260
        },
        {
          "x": 400,
          "y": 283
        },
        {
          "x": 385,
          "y": 324
        },
        {
          "x": 378,
          "y": 344
        },
        {
          "x": 347,
          "y": 375
        },
        {
          "x": 314,
          "y": 383
        },
        {
          "x": 292,
          "y": 382
        },
        {
          "x": 272,
          "y": 365
        },
        {
          "x": 276,
          "y": 332
        },
        {
          "x": 286,
          "y": 300
        },
        {
          "x": 300,
          "y": 228
        },
        {
          "x": 300,
          "y": 189
        },
        {
          "x": 270,
          "y": 175
        },
        {
          "x": 243,
          "y": 179
        },
        {
          "x": 216,
          "y": 220
        },
        {
          "x": 214,
          "y": 269
        },
        {
          "x": 218,
          "y": 312
        },
        {
          "x": 175,
          "y": 370
        },
        {
          "x": 152,
          "y": 377
        },
        {
          "x": 138,
          "y": 344
        },
        {
          "x": 146,
          "y": 320
        },
        {
          "x": 157,
          "y": 274
        },
        {
          "x": 112,
          "y": 259
        },
        {
          "x": 45,
          "y": 263
        },
        {
          "x": 25,
          "y": 181
        },
        {
          "x": 30,
          "y": 109
        },
        {
          "x": 67,
          "y": 49
        },
        {
          "x": 117,
          "y": 53
        },
        {
          "x": 172,
          "y": 54
        },
        {
          "x": 314,
          "y": 44
        },
        {
          "x": 311,
          "y": 55
        },
        {
          "x": 220,
          "y": 87
        },
        {
          "x": 150,
          "y": 107
        },
        {
          "x": 74,
          "y": 130
        },
        {
          "x": 48,
          "y": 143
        }
      ]
    }
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
