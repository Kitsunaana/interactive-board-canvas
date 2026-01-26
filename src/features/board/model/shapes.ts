import type { ShapeDomain } from "@/entities/shape";
import { generateRandomColor } from "@/shared/lib/color";
import * as rx from "rxjs";

export const shapes: ShapeDomain.Shape[] = [
  {
    id: "1",
    x: 250,
    y: 250,
    angle: 0,
    width: 250,
    opacity: 1,
    height: 125,
    sketch: false,
    borderRadius: 0,
    type: "rectangle",
    fillColor: "yellow",
    strokeColor: "orange",
    colorId: generateRandomColor(),
  },
  {
    id: "2",
    x: 120,
    y: 120,
    width: 100,
    height: 100,
    type: "rectangle",
    sketch: true,
    colorId: generateRandomColor(),

    angle: 0,
    opacity: 1,
    borderRadius: 0,
    fillColor: "yellow",
    strokeColor: "orange",
  },
  {
    id: "3",
    x: 100,
    y: -200,
    width: 250,
    height: 100,
    type: "rectangle",
    sketch: true,
    colorId: generateRandomColor(),

    angle: 0,
    opacity: 1,
    borderRadius: 0,
    fillColor: "yellow",
    strokeColor: "orange",
  },
  {
    id: "7",
    x: 0,
    y: 0,
    width: 200,
    height: 200,
    sketch: true,
    type: "ellipse",
    colorId: generateRandomColor(),

    angle: 0,
    opacity: 1,
    fillColor: "pink",
    strokeColor: "#391a4d",
  },
  {
    id: "4",
    x: -250,
    y: -300,
    width: 100,
    height: 100,
    type: "rectangle",
    sketch: false,
    colorId: generateRandomColor(),

    angle: 0,
    opacity: 1,
    borderRadius: 0,
    fillColor: "yellow",
    strokeColor: "orange",
  },
  {
    id: "5",
    x: 320,
    y: 2000,
    width: 100,
    height: 70,
    type: "rectangle",
    sketch: false,
    colorId: generateRandomColor(),

    angle: 0,
    opacity: 1,
    borderRadius: 0,
    fillColor: "yellow",
    strokeColor: "orange",
  },
  {
    id: "6",
    x: 3200,
    y: 400,
    width: 100,
    height: 70,
    type: "rectangle",
    sketch: false,
    colorId: generateRandomColor(),

    angle: 0,
    opacity: 1,
    borderRadius: 0,
    fillColor: "yellow",
    strokeColor: "orange",
  }
]



export const shapes$ = new rx.BehaviorSubject(shapes)