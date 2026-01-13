import type { Point } from "@/shared/type/shared"
import type { Camera } from "./_domain"

export const VELOCITY_SCALE = 0.2
export const MIN_VELOCITY = 5
export const FRICTION = 0.85

export const DEFAULT_POINT: Point = {
  x: 0,
  y: 0,
}

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
  scale: 2,
  x: -50,
  y: 600,
}

export const ZOOM_INTENSITY = 0.1
export const ZOOM_MIN_SCALE = 0.01
export const ZOOM_MAX_SCALE = 10

export const INITIAL_LAST_POSITION = { ...DEFAULT_POINT }
export const INITIAL_PAN_OFFSET = { ...DEFAULT_POINT }
export const INITIAL_VELOCITY = { ...DEFAULT_POINT }

export const INITIAL_STATE = {
  lastPosition: INITIAL_LAST_POSITION,
  panOffset: INITIAL_PAN_OFFSET,
  velocity: INITIAL_VELOCITY,
  camera: INITIAL_CAMERA,
}

