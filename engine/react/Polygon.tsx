import { pick } from "lodash";
import { forwardRef, type RefObject } from "react";
import { type PolygonConfig, PolygonShape } from "../shapes";
import { type NodeProps, useSyncShapeWithComponent } from "./Node";
import type { SimObject } from "engine/core/SimObject";

export type PolygonProps = PolygonConfig & NodeProps

export type ShapeCallbackName = Exclude<keyof PolygonProps, keyof PolygonConfig>

const SHAPE_CONFIG_PROP_NAMES: Array<keyof PolygonConfig> = [
  "initialPoints",
  "strokeStyle",
  "fillStyle",
  "lineWidth",
  "tension",
  "closed",
  "cubic",
  "names",
  "zIndex",
]

export const PolygonNode = forwardRef<PolygonShape, PolygonProps>((props, ref) => {
  const shapeConfig = pick(props, SHAPE_CONFIG_PROP_NAMES) as PolygonConfig

  useSyncShapeWithComponent({
    factory: () => new PolygonShape(shapeConfig) as SimObject,
    shapeConfig,
    props,
    ref: ref as RefObject<SimObject>
  })

  return <></>
})