import { Bounds, Matrix3x3, Point, type PointData, Polygon, Rectangle } from "../maths";
import { BackgroundImage } from "../styles/background-image";
import { type GetBoundsParams } from "../world/sim-object";
import { Shape } from "./Shape";

const source = "https://i.pinimg.com/736x/78/ea/88/78ea88af3c4dec0b3231ff1a06c5de8b.jpg"

export class Ellipse extends Shape {
  public initialPoints: Array<PointData>
  public pointsToTrace: Array<PointData>

  public constructor(private x: number, private y: number, private rx: number, private ry: number) {
    super()

    this.isShowOrigins = false

    this.initialPoints = Ellipse.computePointsToTrace(x, y, rx, ry)
    this.pointsToTrace = this.initialPoints.map(point => ({ ...point }))

    this.backgroundImage = new BackgroundImage()
      .setSimObject(this)
      .setContainer(this.getBounds())
      .setBackgroundImage(source)
      .setBackgroundSize("cover")
  }

  public static computePointsToTrace(cx: number, cy: number, rx: number, ry: number): Array<PointData> {
    const K = 4 * (Math.sqrt(2) - 1) / 3

    const transform = (x: number, y: number) => ({ x: cx + x, y: cy + y })

    return [
      transform(rx, 0),
      transform(rx, K * ry),
      transform(K * rx, ry),
      transform(0, ry),
      transform(-K * rx, ry),
      transform(-rx, K * ry),
      transform(-rx, 0),
      transform(-rx, -K * ry),
      transform(-K * rx, -ry),
      transform(0, -ry),
      transform(K * rx, -ry),
      transform(rx, -K * ry),
    ]
  }

  public getBounds(params: GetBoundsParams = {}): Rectangle {
    const matrix = params.skipTransform
      ? Matrix3x3.identity()
      : params.skipWorldTransform
        ? Matrix3x3.compose(this.localMatrix)
        : Matrix3x3.compose(this.worldMatrix, this.localMatrix)

    const center = matrix.applyToPoint(new Point(this.x, this.y))

    const halfSize = new Point(
      Math.sqrt(Math.pow(matrix.a * this.rx, 2) + Math.pow(matrix.c * this.ry, 2)),
      Math.sqrt(Math.pow(matrix.b * this.rx, 2) + Math.pow(matrix.d * this.ry, 2))
    )

    const min = center.sub(halfSize)
    const max = center.add(halfSize)

    const bounds = new Bounds(...min.array(), ...max.array())

    return this.applyStylesToBounds(bounds.rectangle)
  }

  public getUnrotateShapeBounds(): Rectangle {
    const unrotate = Matrix3x3.aroundOrigin(this.getOriginPosition("rotate"), () => {
      return Matrix3x3.rotate(-this.getCurrentAngle())
    })

    const matrix = Matrix3x3.compose(unrotate, this.worldMatrix, this.localMatrix)
    const center = matrix.applyToPoint(new Point(this.x, this.y))

    const halfSize = new Point(
      Math.sqrt(Math.pow(matrix.a * this.rx, 2) + Math.pow(matrix.c * this.ry, 2)),
      Math.sqrt(Math.pow(matrix.b * this.rx, 2) + Math.pow(matrix.d * this.ry, 2))
    )

    const min = center.sub(halfSize)
    const max = center.add(halfSize)

    const bounds = new Bounds(...min.array(), ...max.array())

    return this.applyStylesToBounds(bounds.rectangle)
  }

  public tracePath(context: CanvasRenderingContext2D): void {
    const length = this.pointsToTrace.length

    context.moveTo(this.pointsToTrace[0].x, this.pointsToTrace[0].y)

    for (let i = 1; i < length; i += 3) {
      const p1 = this.pointsToTrace[i]
      const p2 = this.pointsToTrace[(i + 1) % length]
      const p3 = this.pointsToTrace[(i + 2) % length]

      context.bezierCurveTo(p1.x, p1.y, p2.x, p2.y, p3.x, p3.y)
    }
  }
}