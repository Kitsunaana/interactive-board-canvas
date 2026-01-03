import type {Rect} from "../type/shared.ts";

export const isNotNull = <T>(value: T): value is NonNullable<T> => value !== null

export const isNegative = (value: number) => value < 0

export const getCanvasSizes = () => ({
  height: window.innerHeight,
  width: window.innerWidth,
})

export const getBoundingClientRect = (event: PointerEvent): Rect => {
  const rect = (event.target as HTMLElement).getBoundingClientRect()
  
  return {
    height: rect.height,
    width: rect.width,
    x: rect.x,
    y: rect.y,
  }
}

export const merge = <A extends object, B extends object>(a: A, b: B) => ({ ...a, ...b })

export const _u = { merge }