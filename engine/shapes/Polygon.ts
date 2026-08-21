import { Matrix3x3, Point, Polygon, Rectangle, type PointData } from "../maths";
import { type GetBoundsParams } from "../world/sim-object";
import { Shape } from "./Shape";

const source = "https://avatars.mds.yandex.net/i?id=2e34b2a2ac0026106cc76353e2797bf03b9e2551-5249431-images-thumbs&n=13";

type PolygonConfig = {
  initialPoints: Array<PointData>
  sketchStyle?: boolean
  strokeColor?: string
  draggable?: boolean
  fillColor?: string
  lineWidth?: number
  tension?: number
  closed?: boolean
}

const mergeConfigWithDefaultValues = ({ tension, closed, initialPoints, ...config }: PolygonConfig) => {
  return {
    ...config,
    sketchStyle: config.sketchStyle ?? false,
    strokeColor: config.strokeColor ?? "black",
    fillColor: config.fillColor ?? "skyblue",
    draggable: config.draggable ?? false,
    lineWidth: config.lineWidth ?? 1,

    _initialPoints: initialPoints ?? [],
    _tension: tension ?? 0,
    _closed: closed ?? true,
  }
}

type TracePathParams = {
  context: CanvasRenderingContext2D,
  pointsToTrace: Array<PointData>,
  tension: number,
  closed: boolean
}

export class PolygonShape extends Shape {
  public static isPolygon(candidate: unknown): candidate is PolygonShape {
    return candidate instanceof PolygonShape;
  }

  public static tracePath({ pointsToTrace, context, closed, tension }: TracePathParams): void {
    context.beginPath();

    const shouldRenderStraightEdges = PolygonShape.prototype._shouldRenderStraightEdges.call({
      tension: () => tension,
      _pointsToTrace: pointsToTrace,
    })

    const traceMethodName = shouldRenderStraightEdges ? "linear" : "spline"
      ; ({
        linear: PolygonShape.prototype._traceLinearPath,
        spline: PolygonShape.prototype._traceSplinePath,
      })[traceMethodName].call({ _pointsToTrace: pointsToTrace }, context);

    if (closed) context.closePath();
  }

  protected _pointsToTrace: Array<PointData> = [];
  protected _initialPoints!: Array<PointData>

  public isDrawOriginPosition: boolean = false
  public isDrawCorners: boolean = false
  public isDrawBounds: boolean = false

  private _tension: number = 0.0;
  private _closed: boolean = true;

  public constructor(params: PolygonConfig) {
    const { _initialPoints, ...config } = mergeConfigWithDefaultValues(params)

    super();

    Object.assign(this, config)

    const bounds = Polygon.getBounds(_initialPoints)
    const origin = bounds.point()

    this._initialPoints = _initialPoints.map((point) => ({
      x: point.x - origin.x,
      y: point.y - origin.y
    }))

    this._pointsToTrace = this.computePointsToTraceWithTension(this._initialPoints);

    this.bindEvents()
    this.subscribe(this)
  }

  public get position() {
    return this.getBounds().point()
  }

  public set position(nextPos: PointData) {
    const currentPosition = this.getBounds().point()
    const delta = Point.fromData(nextPos).sub(currentPosition)
    this.translate(delta)
  }

  public get closed() {
    return this._closed
  }

  public get tension() {
    return this._tension
  }

  public set closed(value: boolean) {
    this._closed = value
    this.updateAfterTransform()
  }

  public set tension(value: number) {
    this._tension = value
    this.updateAfterTransform()
  }

  public update(_time: number): void {
  }

  public updateAfterTransform(): void {
    if (!this.isInteracting) {
      const matrix = this.worldMatrix
      const transformedPoints = this._initialPoints.map(matrix.applyToPoint.bind(matrix))
      this._pointsToTrace = this.computePointsToTraceWithTension(transformedPoints)
    }
  }

  public getPoints(): Array<PointData> {
    const curveExtrema = Polygon.computeTensionedCurveExtrema(this._initialPoints, this.tension)
    return this._initialPoints.concat(curveExtrema)
  }

  public computePointsToTraceWithTension(points: Array<PointData>): Array<PointData> {
    const length = points.length;
    const tension = this.tension

    return points.reduce((result, _, index, list) => {
      if (!this.closed && index === list.length - 1) return result;

      const p0 = list[(index - 1 + length) % length];
      const p1 = list[index];
      const p2 = list[(index + 1) % length];
      const p3 = list[(index + 2) % length];

      const cp1 = Point
        .fromData(p2)
        .sub(p0)
        .scale(tension).
        add(p1);

      const cp2 = Point
        .fromData(p2)
        .sub(
          Point
            .fromData(p3)
            .sub(p1)
            .scale(tension),
        );

      return result.concat([cp1, cp2, p2]);
    }, [{ ...points[0] }] as Array<PointData>);
  }

  public getUnrotateBounds(): Rectangle {
    const origin = this.getInLocalOriginPosition("rotate")
    const currentAngle = -this.getCurrentAngle()
    const unrotate = Matrix3x3.aroundOrigin(origin, () => Matrix3x3.rotate(currentAngle))

    const composed = Matrix3x3.compose(unrotate, this.worldMatrix)

    const transformedPoints = this._initialPoints.map(composed.applyToPoint.bind(composed))
    const curveExtrema = Polygon.computeTensionedCurveExtrema(transformedPoints, this.tension)

    return Polygon.getBounds(curveExtrema.concat(transformedPoints))
  }

  public getBounds(params: GetBoundsParams = {}): Rectangle {
    const points = params.skipTransform
      ? this._initialPoints
      : this._initialPoints.map(this.worldMatrix.applyToPoint.bind(this.worldMatrix))

    const curveExtrema = Polygon.computeTensionedCurveExtrema(points, this.tension)
    const allPoints = points.concat(curveExtrema)

    return Polygon.getBounds(allPoints)
  }

  public render(context: CanvasRenderingContext2D): void {
    if (this._shouldDrawFromCache()) this._drawCacheCanvas(context)
    else this._drawMainCanvas(context)
  }

  public tracePath(context: CanvasRenderingContext2D): void {
    context.beginPath();
    if (this._shouldRenderStraightEdges()) this._traceLinearPath(context);
    else this._traceSplinePath(context);
    if (this.closed) context.closePath();
  }

  public drawInOffscreen(context: CanvasRenderingContext2D & OffscreenCanvasRenderingContext2D) {
    PolygonShape.tracePath({
      pointsToTrace: this._pointsToTrace,
      tension: this.tension,
      closed: this.closed,
      context,
    })

    this.fillStrokeShape(context)
  }

  private _drawMainCanvas(context: CanvasRenderingContext2D) {
    context.save()
    if (this.isInteracting) context.translate(...this._translate.array())
    super.render(context);
    context.restore()
  }

  private _shouldDrawFromCache() {
    return (this.isCached && this.cachedCanvas)
  }

  private _drawCacheCanvas(context: CanvasRenderingContext2D) {
    if (this.isCacheDirty) this.cache(this.cachedConfig)

    const config = this.cachedConfig
    const canvas = this.cachedCanvas!
    const shift = config.offset * 2

    const bounds = this.getBounds({ skipTransform: false })

    context.save()
    context.translate(
      ...this._translate
        .add({ x: config.offset, y: config.offset })
        .array()
    )
    context.drawImage(canvas, bounds.x - shift, bounds.y - shift)

    context.strokeStyle = "red"
    context.strokeRect(bounds.x - shift, bounds.y - shift, canvas.width, canvas.height)
    context.restore()
  }

  private _traceLinearPath(context: CanvasRenderingContext2D): void {
    context.moveTo(this._pointsToTrace[0].x, this._pointsToTrace[0].y);
    this._pointsToTrace.forEach((point) => context.lineTo(point.x, point.y));
  }

  private _traceSplinePath(context: CanvasRenderingContext2D): void {
    const length = this._pointsToTrace.length;

    context.moveTo(this._pointsToTrace[0].x, this._pointsToTrace[0].y);

    for (let i = 1; i < length; i += 3) {
      const p1 = this._pointsToTrace[i];
      const p2 = this._pointsToTrace[i + 1];
      const p3 = this._pointsToTrace[i + 2];

      context.bezierCurveTo(p1.x, p1.y, p2.x, p2.y, p3.x, p3.y);
    }
  }

  private _shouldRenderStraightEdges(): boolean {
    return this._pointsToTrace.length < 3 || this.tension === 0;
  }
}
