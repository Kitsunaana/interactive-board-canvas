import { pick } from "lodash";
import { type ForwardedRef, type RefObject, useEffect, useImperativeHandle, useRef } from "react";
import type { EventObject } from "../behaviors/EventBehavior";
import type { NodeConfig, SafeParams } from "../core/Node";
import type { SimObject } from "../core/SimObject";
import { type AnyFunction, forEachObject } from "../utils";
import { useContainerParent } from "./Container";

export type NodeCallback<Target = SimObject> = {
  onPointerDown?: (event: EventObject<PointerEvent, Target>) => void
  onPointerMove?: (event: EventObject<PointerEvent, Target>) => void
  onPointerUp?: (event: EventObject<PointerEvent, Target>) => void
  onPointerOver?: (event: EventObject<PointerEvent, Target>) => void
  onPointerOut?: (event: EventObject<PointerEvent, Target>) => void
  onPointerEnter?: (event: EventObject<PointerEvent, Target>) => void
  onPointerLeave?: (event: EventObject<PointerEvent, Target>) => void

  onMouseDown?: (event: EventObject<MouseEvent, Target>) => void
  onMouseMove?: (event: EventObject<MouseEvent, Target>) => void
  onMouseUp?: (event: EventObject<MouseEvent, Target>) => void
  onMouseOver?: (event: EventObject<MouseEvent, Target>) => void
  onMouseOut?: (event: EventObject<MouseEvent, Target>) => void
  onMouseEnter?: (event: EventObject<MouseEvent, Target>) => void
  onMouseLeave?: (event: EventObject<MouseEvent, Target>) => void

  onClick?: (event: EventObject<MouseEvent, Target>) => void
  onDblclick?: (event: EventObject<MouseEvent, Target>) => void

  onPointerClick?: (event: EventObject<PointerEvent, Target>) => void
  onPointerDblclick?: (event: EventObject<PointerEvent, Target>) => void

  onTap?: (event: EventObject<TouchEvent, Target>) => void
  onDbltap?: (event: EventObject<TouchEvent, Target>) => void
}

export type NodeProps<Target = SimObject> = NodeCallback<Target> & {
  attributes?: Record<string, unknown>
}

export type ShapeCallbackName = Exclude<keyof NodeCallback, keyof NodeConfig>

const SHAPE_CALLBACK_NAMES: Array<ShapeCallbackName> = [
  "onPointerDown",
  "onPointerMove",
  "onPointerUp",
  "onPointerOver",
  "onPointerOut",
  "onPointerEnter",
  "onPointerLeave",

  "onMouseDown",
  "onMouseMove",
  "onMouseUp",
  "onMouseOver",
  "onMouseOut",
  "onMouseEnter",
  "onMouseLeave",

  "onClick",
  "onDblclick",

  "onPointerClick",
  "onPointerDblclick",

  "onTap",
  "onDbltap"
]

export const CALLBACK_NAME_ALIASES: Record<ShapeCallbackName, string> = {
  onPointerDown: "pointerdown",
  onPointerMove: "pointermove",
  onPointerUp: "pointerup",
  onPointerOver: "pointerover",
  onPointerOut: "pointerout",
  onPointerEnter: "pointerenter",
  onPointerLeave: "pointerleave",

  onMouseDown: "mousedown",
  onMouseMove: "mousemove",
  onMouseUp: "mouseup",
  onMouseOver: "mouseover",
  onMouseOut: "mouseout",
  onMouseEnter: "mouseenter",
  onMouseLeave: "mouseleave",

  onClick: "click",
  onDblclick: "dblclick",

  onPointerClick: "pointerclick",
  onPointerDblclick: "pointerdblclick",

  onTap: "tap",
  onDbltap: "dbltap",
}

export const useSyncShapeWithComponent = <
  P extends NodeProps, C extends NodeConfig, I extends SimObject
>({ props, shapeConfig, factory, ref }: {
  factory: () => I
  shapeConfig: C,
  props: P,
  ref:  ForwardedRef<I>
}): RefObject<I> => {
  const container = useContainerParent()

  const shapeCallbacks = pick(props, SHAPE_CALLBACK_NAMES)
  const shapeRef = useRef(factory())

  useImperativeHandle(ref, () => shapeRef.current, [shapeRef.current])

  useEffect(() => {
    const shape = shapeRef.current!

    shape.clearDataAttrs()

    if (props.attributes) {
      Object
        .entries(props.attributes)
        .map(([key, value]) => shape.setDataAttr(key, value))
    }
  }, [props.attributes])

  useEffect(() => {
    const shape = shapeRef.current

    if (shape.parent !== container) {
      shape.remove()
      container.appendChild(shape)
    }

    forEachObject(shapeConfig, (entry) => shape.setAttribute(entry.key as keyof SafeParams<I>, entry.value as unknown as I[keyof SafeParams<I>]))
    forEachObject(shapeCallbacks, (entry) => shape.on(CALLBACK_NAME_ALIASES[entry.key], entry.value as AnyFunction))

    return () => {
      forEachObject(shapeCallbacks, (entry) => shape.off(CALLBACK_NAME_ALIASES[entry.key], entry.value as AnyFunction))
      shape.remove()
    }
  }, [...Object.values(shapeConfig)])

  return shapeRef
}
