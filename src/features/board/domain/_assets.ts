import { generateRandomColor } from "../modules/_pick-node";
import type { Sticker } from "./sticker.ts";

export const nodes: Sticker[] = [
  {
    id: "1",
    x: 250,
    y: 250,
    width: 250,
    height: 125,
    type: "sticker",
    variant: "default",
    colorId: generateRandomColor(),
  },
  {
    id: "2",
    x: 120,
    y: 120,
    width: 100,
    height: 100,
    type: "sticker",
    variant: "default",
    colorId: generateRandomColor()
  },
  {
    id: "3",
    x: -200,
    y: -200,
    width: 400,
    height: 100,
    type: "sticker",
    variant: "default",
    colorId: generateRandomColor()
  },
  {
    id: "4",
    x: -250,
    y: -300,
    width: 100,
    height: 100,
    type: "sticker",
    variant: "default",
    colorId: generateRandomColor()
  },
  {
    id: "5",
    x: 320,
    y: 2000,
    width: 100,
    height: 70,
    type: "sticker",
    variant: "default",
    colorId: generateRandomColor()
  },
  {
    id: "6",
    x: 3200,
    y: 400,
    width: 100,
    height: 70,
    type: "sticker",
    variant: "default",
    colorId: generateRandomColor()
  }
]
