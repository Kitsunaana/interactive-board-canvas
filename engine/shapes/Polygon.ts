import { } from "lodash";
import { type NodeConfig } from "../Node";
import * as Primitive from "../maths";
import { Shape } from "./Shape";

export interface PolygonConfig extends NodeConfig {
  points: Primitive.PointData[],
  name?: string | undefined
  fillColor?: string
  strokeColor?: string
  fill?: boolean
  stroke?: boolean
}

export class Polygon extends Shape {}