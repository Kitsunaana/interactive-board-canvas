export type Point = {
  x: number
  y: number
}

export type Path = Array<Point>

export type RectangleShape = {
  type: "rectangle"
  height: number
  width: number
  x: number
  y: number
}

export type PathShape = {
  points: Path
  type: "path"
}

export type Shape = PathShape | RectangleShape