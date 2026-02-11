import type { Rect } from "@/shared/type/shared"

export interface ShapePrimitive {
  contains(x: number, y: number): boolean
  clone(): ShapePrimitive
  copyFrom(source: ShapePrimitive): void
  copyTo(target: ShapePrimitive): void
  getBounds(out: Rect): Rect
}