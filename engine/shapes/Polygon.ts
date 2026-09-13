import { Matrix3x3, Point, Polygon, Rectangle, type PointData } from "../maths";
import { type GetPointsParams, type GetBoundsParams } from "../world/sim-object";
import { Shape } from "./Shape";

type PolygonConfig = {
  initialPoints: Array<PointData>
  sketchStyle?: boolean
  strokeColor?: string
  draggable?: boolean
  fillColor?: string
  lineWidth?: number
  tension?: number
  closed?: boolean
  cubic?: boolean
}

const mergeConfigWithDefaultValues = ({ tension, closed, cubic, initialPoints, ...config }: PolygonConfig) => {
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
    _cubic: cubic ?? false
  }
}

export class PolygonShape extends Shape {
  public static isPolygon(candidate: unknown): candidate is PolygonShape {
    return candidate instanceof PolygonShape;
  }

  protected _pointsToTrace: Array<PointData> = [];
  protected _initialPoints!: Array<PointData>

  public isDrawOriginPosition: boolean = false
  public isDrawCorners: boolean = false
  public isDrawBounds: boolean = false

  private _tension: number = 0.0;
  private _closed: boolean = true;
  private _cubic: boolean = false

  public constructor(params: PolygonConfig) {
    const { _initialPoints, ...config } = mergeConfigWithDefaultValues(params)

    super();

    Object.assign(this, config)

    const bounds = Polygon.getBounds(_initialPoints)
    const origin = bounds.point()

    this._initialPoints = _initialPoints

    this._pointsToTrace = this.computePointsToTraceWithTension(this._initialPoints);

    // this.eventBus.on()

    this.bindEvents()
    this.subscribe(this)
  }

  public get position() {
    return this.getBounds().point()
  }

  public get pointsToTrace() {
    return this._pointsToTrace
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

  public getPoints(params: GetPointsParams = {}): Array<PointData> {
    const curveExtrema = Polygon.computeTensionedCurveExtrema(this._initialPoints, this.tension)
    const points = this._initialPoints.concat(curveExtrema)

    if (params.applyTransform) {
      const matrix = this.worldMatrix.clone()

      if (params.applyCachedTransform) {
        const parentsMatrix = this.getAllParents().map((p) => p.cachedMatrix)
        const nextMatrix = Matrix3x3.compose(...parentsMatrix, this.cachedMatrix, this.worldMatrix)

        matrix.copyFrom(nextMatrix)
      }

      return points.map(matrix.applyToPoint.bind(matrix))
    }

    return points
  }

  public setPoints(points: Array<PointData>) {
    this.worldMatrix = Matrix3x3.identity()
    this.localMatrix = Matrix3x3.identity()

    this._initialPoints = points.map((point) => ({ ...point }))
    this._pointsToTrace = this._initialPoints

    this.updateAfterTransform()
  }

  public computePointsToTraceWithTension(points: Array<PointData>): Array<PointData> {
    const length = points.length;
    const tension = this.tension

    if (tension === 0) return points

    return points.reduce((result, _, index, list) => {
      if (!this.closed && index === list.length - 1) return result;

      const p0 = list[(index - 1 + length) % length];
      const p1 = list[index];
      const p2 = list[(index + 1) % length];
      const p3 = list[(index + 2) % length];

      const cp1 = Point
        .fromData(p2)
        .sub(p0)
        .scale(tension)
        .add(p1);

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

  public render(context: CanvasRenderingContext2D): void {
    if (!this.visible) return

    context.betweenSaveAndRestore(() => super.render(context))
  }

  public getBounds(params: GetBoundsParams = {}): Rectangle {
    const points = params.skipTransform
      ? this._initialPoints
      : this._initialPoints.map(this.worldMatrix.applyToPoint.bind(this.worldMatrix))

    const curveExtrema = Polygon.computeTensionedCurveExtrema(points, this.tension)
    const allPoints = points.concat(curveExtrema)

    return Polygon.getBounds(allPoints)
  }

  public tracePath(context: CanvasRenderingContext2D): void {
    context.beginPath();
    if (this._tension !== 0 || this._cubic) this._traceSplinePath(context)
    else this._traceLinearPath(context)
    if (this.closed) context.closePath();
  }

  private _traceLinearPath(context: CanvasRenderingContext2D): void {
    context.moveTo(this._pointsToTrace[0].x, this._pointsToTrace[0].y);
    this._pointsToTrace.forEach((point) => context.lineTo(point.x, point.y));
  }

  private _traceSplinePath(context: CanvasRenderingContext2D): void {
    const points = this._pointsToTrace
    const length = points.length;

    context.moveTo(points[0].x, points[0].y);

    if (points.length === 4) {
      for (let i = 1; i < length; i += 3) {
        const cp1 = points[i]
        const cp2 = points[(i + 1) % length]
        const p = points[(i + 2) % length]

        context.bezierCurveTo(cp1.x, cp1.y, cp2.x, cp2.y, p.x, p.y)
      }

      return
    }

    for (let i = 1; i < length; i += 3) {
      const cp1 = this.pointsToTrace[i]
      const cp2 = this.pointsToTrace[i + 1]
      const p = this.pointsToTrace[i + 2]

      context.bezierCurveTo(cp1.x, cp1.y, cp2.x, cp2.y, p.x, p.y)
    }
  }

  private _shouldRenderStraightEdges(): boolean {
    return this._pointsToTrace.length < 3 || this.tension === 0;
  }
}
