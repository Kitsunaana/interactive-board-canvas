import { Matrix3x3, Polygon } from "../../maths";
import type { TransformStrategy } from "./transform-operation.interface"

export abstract class BaseTransformOperation {
  public constructor(protected readonly box: TransformStrategy) { }

  protected computeTransformHandlerPositions(padding: number) {
    const composed = Matrix3x3.compose(this.box.cachedMatrix, this.box.worldMatrix)

    const forAngle = ({
      rotate: composed,
      idle: this.box.worldMatrix,
      resize: this.box.worldMatrix,
    })[this.box.transformState];

    const currentAngle = Math.atan2(forAngle.b, forAngle.a)

    const originRotate = composed.applyToPoint(this.box.getOriginInOriginalSpace("rotate"))
    const unrotate = Matrix3x3.aroundOrigin(originRotate, () => Matrix3x3.rotate(-currentAngle))
    const rotate = Matrix3x3.aroundOrigin(originRotate, () => Matrix3x3.rotate(currentAngle))

    const matrix = Matrix3x3.compose(unrotate, composed)
    const bounds = this.box.getBounds({ skipTransform: true })
    const corners = bounds.getCorners()
    const points = corners.map(matrix.applyToPoint.bind(matrix))
    const scaledBounds = Polygon.getBounds(points).padding(padding)
    const nextCorners = scaledBounds.getCorners()
    const nextPoints = nextCorners.map(rotate.applyToPoint.bind(rotate))

    const mappedCorners = nextPoints

    return {
      corner: {
        bottomRight: mappedCorners[2],
        bottomLeft: mappedCorners[3],
        topRight: mappedCorners[1],
        topLeft: mappedCorners[0],
      },

      edge: {
        bottom: [mappedCorners[2], mappedCorners[3]],
        right: [mappedCorners[1], mappedCorners[2]],
        left: [mappedCorners[3], mappedCorners[0]],
        top: [mappedCorners[0], mappedCorners[1]],

      }
    } as const;
  }
}
