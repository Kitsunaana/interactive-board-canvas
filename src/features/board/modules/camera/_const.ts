import type { Point } from "@/shared/type/shared"
import type { Camera } from "./_domain"

export const VELOCITY_SCALE = 1.0
export const FRICTION = 0.90

export const ZOOM = {
  INTENSITY: 0.1,
  MIN_SCALE: 0.1,
  MAX_SCALE: 10,
}

export const START_POINT: Point = {
  x: 0,
  y: 0,
}

export const INITIAL_CAMERA: Camera = {
  scale: 1.1,
  x: -100,
  y: 0,
}

export const ZOOM_INTENSITY = 0.1
export const ZOOM_MIN_SCALE = 0.01
export const ZOOM_MAX_SCALE = 10
