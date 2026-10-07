import type {EventObject} from "../../behaviors/EventBehavior_v2";
import type {Shape} from "../Shape";

export interface State {
  node?: {
    onPointerDown?: (event: EventObject<PointerEvent, Shape>) => void,
    onPointerMove?: (event: EventObject<PointerEvent, Shape>) => void,
    onPointerUp?: (event: EventObject<PointerEvent, Shape>) => void,
  },

  canvas?: {
    onPointerDown?: (event: EventObject<PointerEvent>) => void,
    onPointerMove?: (event: EventObject<PointerEvent>) => void,
    onPointerUp?: (event: EventObject<PointerEvent>) => void,
  }

  resizeHandler?: {
    onPointerDown?: (event: EventObject<PointerEvent>) => void,
    onPointerMove?: (event: EventObject<PointerEvent>) => void,
    onPointerUp?: (event: EventObject<PointerEvent>) => void,
  }
}