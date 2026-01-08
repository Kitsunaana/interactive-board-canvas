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

export type LimitPoints = {
  min: Point
  max: Point
}

export type Simplify<T> = { [K in keyof T]: T[K] } & {}