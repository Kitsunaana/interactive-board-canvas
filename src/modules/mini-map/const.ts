import type { Node } from "../../type"

export const MINI_MAP_UNSCALE = 3.5

export const NODES: Node[] = [
  {
    id: "1",
    x: -200,
    y: -200,
    width: 100,
    height: 70,
  },
  {
    id: "1",
    x: -150,
    y: -150,
    width: 100,
    height: 70,
  },
  {
    id: "2",
    x: 200,
    y: 200,
    width: 100,
    height: 70,
  },
  {
    id: "2",
    x: 320,
    y: 2000,
    width: 100,
    height: 70,
  }
]

export const MINI_MAP_SIZES = {
  height: Math.round(window.innerHeight / MINI_MAP_UNSCALE),
  width: Math.round(window.innerWidth / MINI_MAP_UNSCALE),
}