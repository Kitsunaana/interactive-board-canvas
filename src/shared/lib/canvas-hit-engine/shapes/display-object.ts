import { nanoid } from "nanoid";
import type { PointData } from "../math";

export type CanvasEventType = "pointerdown" | "pointerup" | "pointermove" | "click" | "wheel"

export interface CanvasEvent {
  type: CanvasEventType
  nativeEvent: PointerEvent
}

export interface Shape {
  contains(point: PointData): boolean
} 

export class DisplayObject {
  public tag: string = nanoid()
  public parent: DisplayObject | null = null
  public children: Array<DisplayObject> = []

  public x: number = 0
  public y: number = 0
  public scaleX: number = 1
  public scaleY: number = 1
  public rotation: number = 0

  public visible: boolean = true
  public interactive: boolean = true

  private listeners: Map<string, string> = new Map()
}
