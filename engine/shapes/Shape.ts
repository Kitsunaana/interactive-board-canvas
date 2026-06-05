import { Matrix3x3, Point, type PointData } from "../maths";
import { SimObject } from "../world/sim-object";

export abstract class Shape extends SimObject {
  public abstract pointsToTrace: Array<PointData>
  public abstract initialPoints: Array<PointData>

  public get worldMatrix() {
    return this._worldMatrix
  }

  public set worldMatrix(matrix: Matrix3x3) {
    this._worldMatrix = matrix
    this._updatePointsToTrace()
  }

  public get localMatrix() {
    return this._localMatrix
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

  public _updatePointsToTrace() {
    const matrix = Matrix3x3.compose(this._worldMatrix, this._localMatrix)

    this.pointsToTrace = this.initialPoints.map((point) => matrix.applyToPoint(point))
  }
}
