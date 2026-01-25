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

export type RectWithId = Rect & {
  id: string
}

export type Sizes = {
  height: number
  width: number
}

export type RectEdges = {
  bottom: number
  right: number
  left: number
  top: number
}

export type LimitPoints = {
  min: Point
  max: Point
}

export type Simplify<T> = { [K in keyof T]: T[K] } & {}

export type SimplifyUnion<T> = T extends any ? T : never