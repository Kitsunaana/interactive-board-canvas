import { pick } from "lodash";
import { forwardRef } from "react";
import { type CircleConfig, CircleShape } from "../shapes";
import { type NodeProps, useSyncShapeWithComponent } from "./Node";


export type CircleProps = CircleConfig & NodeProps

export type ShapeCallbackName = Exclude<keyof CircleProps, keyof CircleConfig>

const SHAPE_CONFIG_PROP_NAMES: Array<keyof CircleConfig> = [
  "x",
  "y",
  "zIndex",
  "radius",
  "names",
  "fillStyle",
  "lineWidth",
  "strokeStyle",
]

export const CircleNode = forwardRef<CircleShape, CircleProps>((props, ref) => {
  const shapeConfig = pick(props, SHAPE_CONFIG_PROP_NAMES) as CircleConfig

  useSyncShapeWithComponent({
    factory: () => new CircleShape(shapeConfig),
    shapeConfig,
    props,
    ref
  })

  return <></>
})