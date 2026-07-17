import { drawOriginPoint } from "../behaviors/Transformable";
import { Matrix3x3, Point, Polygon, Rectangle, type PointData } from "../maths";
import { BackgroundImage } from "../styles/background-image";
import { type GetBoundsParams } from "../world/sim-object";
import { Shape } from "./Shape";

const source =
  "https://avatars.mds.yandex.net/i?id=2e34b2a2ac0026106cc76353e2797bf03b9e2551-5249431-images-thumbs&n=13";

type PolygonConfig = {
  initialPoints: Array<PointData>
  sketchStyle?: boolean
  strokeColor?: string
  fillColor?: string
  lineWidth?: number
  tension?: number
}

const mergeConfigWithDefaultValues = (config: PolygonConfig): Required<PolygonConfig> => {
  return {
    ...config,
    sketchStyle: config.sketchStyle ?? false,
    strokeColor: config.strokeColor ?? "black",
    fillColor: config.fillColor ?? "skyblue",
    lineWidth: config.lineWidth ?? 1,
    tension: config.tension ?? 0,
  }
}

export class PolygonShape extends Shape {
  public static isPolygon(candidate: unknown): candidate is PolygonShape {
    return candidate instanceof PolygonShape;
  }

  public tension: number = 0.0;
  public closed: boolean = true;
  public pointsToTrace: Array<PointData> = [];

  public isDrawOriginPosition: boolean = false
  public isDrawCorners: boolean = false
  public isDrawBounds: boolean = false

  public readonly initialPoints!: Array<PointData>

  public constructor(params: PolygonConfig) {
    const cofing = mergeConfigWithDefaultValues(params)

    super();

    Object.assign(this, cofing)

    this.pointsToTrace = this.computePointsToTraceWithTension(this.initialPoints);

    this.backgroundImage = new BackgroundImage()
      .setSimObject(this)
      .setContainer(this.getBounds())
      .setBackgroundImage(source)
      .setBackgroundSize("cover");

    this.backgroundImage = null;
  }

  public update(time: number): void { }

  public updateAfterTransform(): void {
    if (!this.isInteracting) {
      const transformedPoints = this.initialPoints.map((point) => this.worldMatrix.applyToPoint(point))
      this.pointsToTrace = this.computePointsToTraceWithTension(transformedPoints)
    }
  }

  public getPoints(): Array<PointData> {
    const curveExtrema = Polygon.computeTensionedCurveExtrema(this.initialPoints, this.tension)
    const allPoints = this.initialPoints.concat(curveExtrema)

    return allPoints
  }

  public computePointsToTraceWithTension(points: Array<PointData>): Array<PointData> {
    const length = points.length;

    return points.reduce((result, _, index, list) => {
      if (!this.closed && index === list.length - 1) return result;

      const p0 = list[(index - 1 + length) % length];
      const p1 = list[index];
      const p2 = list[(index + 1) % length];
      const p3 = list[(index + 2) % length];

      const cp1 = Point.fromData(p2).sub(p0).scale(this.tension).add(p1);

      const cp2 = Point.fromData(p2).sub(
        Point.fromData(p3).sub(p1).scale(this.tension),
      );

      return result.concat([cp1, cp2, p2]);
    }, [{ ...points[0] }] as Array<PointData>);
  }

  public getUnrotateBounds(): Rectangle {
    const unrotate = Matrix3x3.aroundOrigin(
      this.getInLocalOriginPosition("rotate"),
      () => Matrix3x3.rotate(-Math.atan2(this.worldMatrix.b, this.worldMatrix.a))
    )

    const composed = Matrix3x3.compose(unrotate, this.worldMatrix)

    const transformedPoints = this.initialPoints.map(composed.applyToPoint.bind(composed))
    const curveExtrema = Polygon.computeTensionedCurveExtrema(transformedPoints, this.tension)

    return Polygon.getBounds(curveExtrema.concat(transformedPoints))
  }

  public getBounds(params: GetBoundsParams = {}): Rectangle {
    const points = params.skipTransform
      ? this.initialPoints
      : this.initialPoints.map(this.worldMatrix.applyToPoint.bind(this.worldMatrix))

    const curveExtrema = Polygon.computeTensionedCurveExtrema(points, this.tension)
    const allPoints = points.concat(curveExtrema)

    return Polygon.getBounds(allPoints)
  }

  public getPointsWithAppliedOwnTransforms(): Array<PointData> {
    const points = this.initialPoints.map((point) => this.localMatrix.applyToPoint(point))
    const curveExtrema = Polygon.computeTensionedCurveExtrema(points, this.tension)

    return curveExtrema.concat(points)
  }

  public tracePath(context: CanvasRenderingContext2D): void {
    context.beginPath();
    if (this._shouldRenderStraightEdges()) this.traceLinearPath(context);
    else this.traceSplinePath(context);
    if (this.closed) context.closePath();
  }

  public render(context: CanvasRenderingContext2D): void {
    super.render(context);

    if (this.isDrawOriginPosition) this._drawOriginPositions(context)
    if (this.isDrawCorners) this._drawCorners(context)
    if (this.isDrawBounds) this._drawBounds(context)
  }

  public traceLinearPath(context: CanvasRenderingContext2D): void {
    context.moveTo(this.pointsToTrace[0].x, this.pointsToTrace[0].y);
    this.pointsToTrace.forEach((point) => context.lineTo(point.x, point.y));
  }

  public traceSplinePath(context: CanvasRenderingContext2D): void {
    const length = this.pointsToTrace.length;

    context.moveTo(this.pointsToTrace[0].x, this.pointsToTrace[0].y);

    for (let i = 1; i < length; i += 3) {
      const p1 = this.pointsToTrace[i];
      const p2 = this.pointsToTrace[i + 1];
      const p3 = this.pointsToTrace[i + 2];

      context.bezierCurveTo(p1.x, p1.y, p2.x, p2.y, p3.x, p3.y);
    }
  }

  private _drawBounds(context: CanvasRenderingContext2D): void {
    const bounds = this.getBounds({ skipTransform: false })
    context.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height)
  }

  private _drawCorners(context: CanvasRenderingContext2D): void {
    const corners = this.getTransformedCorners()

    context.beginPath()
    PolygonShape.prototype.traceLinearPath.call({ pointsToTrace: corners }, context)
    context.closePath()
    context.stroke()
  }

  private _drawOriginPositions(context: CanvasRenderingContext2D): void {
    const rotateOrigin = this.getInWorldOriginPoisition("rotate")
    const scaleOrigin = this.getInWorldOriginPoisition("scale")

    drawOriginPoint(context, rotateOrigin, "rotate")
    drawOriginPoint(context, scaleOrigin, "scale")
  }

  private _shouldRenderStraightEdges(): boolean {
    return this.pointsToTrace.length < 3 || this.tension === 0;
  }
}
