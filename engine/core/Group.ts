import {Matrix3x3, Polygon, Rectangle} from "../maths"
import {Container} from "./Container"
import {type GetBoundsParams, type GetPointsParams, Node} from "./Node"
import {inverseOrIdentity} from "../behaviors/NodeTransformer";

export class Group extends Container {
  public static isGroup(candidate: unknown): candidate is Group {
    return candidate instanceof Group
  }

  public type: string = "Group"

  public updateAfterTransform(): void {
  }

  public clone() {
    const group = new Group()
    group.appendChild(...this.children.map((node) => node.clone()))
    return group
  }

  public render(context: CanvasRenderingContext2D): void {
    if (!this.isVisible) return;

    context.betweenSaveAndRestore(() => {
      if (this.isInteracting) {
        this.transform
          .getPreviewWorldMatrix()
          .applyToContext(context)
      }

      super.render(context)
    })
  }

  public renderHit(context: CanvasRenderingContext2D): void {
    if (!this.isListening) return

    context.betweenSaveAndRestore(() => {
      if (this.isInteracting) {
        this.transform
          .getPreviewWorldMatrix()
          .applyToContext(context)
      }

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
          : child.transform.worldMatrix;

        return child
          .getPoints()
          .map(matrix.applyToPoint.bind(matrix));
      });

    return Polygon.getBounds(points);
  }

  public getUnrotateBounds(): Rectangle {
    const orientationSource = this.transform.startWorldMatrix ?? this.transform.worldMatrix;
    const angle = Math.atan2(orientationSource.b, orientationSource.a);
    const origin = orientationSource.applyToPoint(this.transform.getOriginInOriginalSpace("rotate"));
    const unrotate = Matrix3x3.aroundOrigin(origin, () => Matrix3x3.rotate(-angle));

    const points = this.getShapes().flatMap((child) => {
      const childWorld = child.transform.worldMatrix;
      const matrix = Matrix3x3.compose(unrotate, childWorld);

      return child
        .getPoints()
        .map(matrix.applyToPoint.bind(matrix));
    });

    return Polygon.getBounds(points);
  }

  private _getMatrixRelativeToGroup(child: Node): Matrix3x3 {
    const chain: Matrix3x3[] = []

    let current: Node | null = child

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
      const inverse = inverseOrIdentity(this.transform.worldMatrix)
      return Matrix3x3.compose(inverse, child.transform.worldMatrix)
    }

    return chain.length === 0 ? Matrix3x3.identity() : Matrix3x3.compose(...chain)
  }
}

