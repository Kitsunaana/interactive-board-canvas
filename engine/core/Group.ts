import {Matrix3x3, Polygon, Rectangle} from "../maths"
import {Container} from "./Container"
import {type GetBoundsParams, type GetPointsParams} from "./Node"
import {inverseOrIdentity} from "../behaviors/NodeTransformer";
import {SimObject} from "./SimObject";

export class Group extends Container {
  public static isGroup(candidate: unknown): candidate is Group {
    return candidate instanceof Group
  }

  public type: string = "Group"

  public updateAfterTransform() {
    
  }

  public clone() {
    const group = new Group()
    group.appendChild(...this.children.map((node) => node.clone()))
    return group
  }

  public render(context: CanvasRenderingContext2D): void {
    if (!this.isVisible) return;

    const bounds = this.bounds
    const unrotateBounds = this.unrotateBounds
    
    context.betweenSaveAndRestore(() => {
      context.strokeStyle = "red"
      // context.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height)

      context.strokeStyle = "green"
      // context.strokeRect(unrotateBounds.x, unrotateBounds.y, unrotateBounds.width, unrotateBounds.height)
      
      this.tryApplyPreviewMatrixToContext(context)
      super.render(context)
    })
  }

  public renderHit(context: CanvasRenderingContext2D): void {
    if (!this.isListening) return

    context.betweenSaveAndRestore(() => {
      this.tryApplyPreviewMatrixToContext(context)
      super.renderHit(context)
    })
  }

  public getPoints(params: GetPointsParams = {}) {
    return this.children.flatMap((child) => child.getPoints(params))
  }

  public getBounds(params: GetBoundsParams = {}): Rectangle {
    const points = this
      .getShapes()
      .flatMap((child) => {
        const matrix = params.skipTransform
          ? this._getMatrixRelativeToGroup(child)
          : child.worldMatrix;

        return child
          .getPoints()
          .map(matrix.applyToPoint.bind(matrix));
      });

    return Polygon.getBounds(points);
  }

  public getUnrotateBounds(): Rectangle {
    const orientationSource = this.startWorldMatrix ?? this.worldMatrix;
    const angle = Math.atan2(orientationSource.b, orientationSource.a);
    const origin = orientationSource.applyToPoint(this.getOriginInOriginalSpace("rotate"));
    const unrotate = Matrix3x3.aroundOrigin(origin, () => Matrix3x3.rotate(-angle));

    const points = this.getShapes().flatMap((child) => {
      const childWorld = child.worldMatrix;
      const matrix = Matrix3x3.compose(unrotate, childWorld);

      return child
        .getPoints()
        .map(matrix.applyToPoint.bind(matrix));
    });

    return Polygon.getBounds(points);
  }

  private _getMatrixRelativeToGroup(child: SimObject): Matrix3x3 {
    const chain: Matrix3x3[] = []

    let current: SimObject | null = child

    while (current && current !== this) {
      const effectiveLocal = current.isInteracting
        ? Matrix3x3.multiply(current.cachedMatrix, current.localMatrix)
        : current.localMatrix
      
      chain.unshift(effectiveLocal)
      current = current.parent
    }

    if (current !== this) {
      debugger
      // TODO:
      const inverse = inverseOrIdentity(this.worldMatrix)
      return Matrix3x3.compose(inverse, child.worldMatrix)
    }

    return chain.length === 0 ? Matrix3x3.identity() : Matrix3x3.compose(...chain)
  }
}

