import { Rectangle } from "./Rectangle"

export interface ShapePrimitive {
  clone(): ShapePrimitive
  copyTo(target: ShapePrimitive): void
  copyFrom(source: ShapePrimitive): void
  contains(x: number, y: number): boolean
  getBounds(out: Rectangle): Rectangle
}