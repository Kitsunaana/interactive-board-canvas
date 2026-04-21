import { Point, type PointData } from "../../../maths/Point"

export type TramsformOperation = "scale" | "skew" | "rotate"

export const TRANSFORM_OPERATIONS = ["rotate", "skew", "scale"] as Array<TramsformOperation>

export type TransformScaleInstruction = {
  type: "scale"
  value: PointData
  relativeOrigin: PointData
}

export type TransformSkewInstruction = {
  type: "skew"
  value: PointData
  relativeOrigin: PointData
}

export type TransformRotateInstruction = {
  type: "rotate"
  value: number
  relativeOrigin: PointData
}

export type TransformInstruction =
  | TransformScaleInstruction
  | TransformSkewInstruction
  | TransformRotateInstruction

export const buildInitialOpearationsRecord = (): Record<TramsformOperation, Point> => ({
  rotate: new Point(),
  scale: new Point(),
  skew: new Point(),
})
