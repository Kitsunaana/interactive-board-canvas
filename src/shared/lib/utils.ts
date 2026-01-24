import type { Rect } from "../type/shared.ts";
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export const isNotNull = <T>(value: T): value is NonNullable<T> => value !== null

export const isNotUndefined = <T>(value: T): value is NonNullable<T> => value !== undefined

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

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const _u = { merge }