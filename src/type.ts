export type Point = {
  x: number
  y: number
}

export type Rect = {
  height: number
  width: number
  x: number
  y: number
}

export type Sizes = {
  height: number
  width: number
}

export type Node = {
  x: number
  y: number
  id: string
  width: number
  height: number
}

export type LimitMapPoints = {
  min: Point
  max: Point
}