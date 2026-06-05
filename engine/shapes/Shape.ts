import { Matrix3x3, Point, type PointData } from "../maths";
import { SimObject } from "../world/sim-object";

export abstract class Node extends SimObject {
  protected abstract _updatePointsToTrace(): void

  public get worldMatrix(): Matrix3x3 {
    return this._worldMatrix
  }

  public get localMatrix(): Matrix3x3 {
    return this._localMatrix
  }

  public set worldMatrix(matrix: Matrix3x3) {
    this._worldMatrix = matrix
    this._updatePointsToTrace()
  }

  public set localMatrix(matrix: Matrix3x3) {
    this._localMatrix = matrix
    this._updatePointsToTrace()
  }

  public rotate(angle: number): void {
    super.rotate(angle)
    this.localMatrix = this.computeMatrix()
  }

  public scale(scale: Point): void {
    super.scale(scale)
    this.localMatrix = this.computeMatrix()
  }
}

export abstract class Shape extends Node {
  public abstract pointsToTrace: Array<PointData>
  public abstract initialPoints: Array<PointData>

  public static isShape(candidate: unknown): candidate is Shape {
    return candidate instanceof Shape
  }

  protected _updatePointsToTrace(): void {
    const matrix = Matrix3x3.compose(this._worldMatrix, this._localMatrix)

    this.pointsToTrace = this.initialPoints.map((point) => matrix.applyToPoint(point))
  }
}
