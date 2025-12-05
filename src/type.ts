export type Level = {
  size: number
  minScale: number
}

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

export type Camera = {
  scale: number
  x: number
  y: number
}

export type ToDrawOneLevelParams = {
  startWorld: Point
  endWorld: Point
  camera: Camera
  level: Level
}

export type ToDrawOneLevelReturn = {
  strokeStyle: string
  lineWidth: number
  startX: number
  startY: number
  endX: number
  endY: number
}

export type ToDrawOneLevel = (params: ToDrawOneLevelParams) => null | ToDrawOneLevelReturn
