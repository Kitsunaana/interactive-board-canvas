import { Transformable } from "../behaviors/Transformable";
import { BaseComponent } from "../components/base-component";
import { type PointData, Polygon, Rectangle } from "../maths";

export class SimObject extends Transformable {
  private _components: Array<BaseComponent> = []
  private _children: Array<SimObject> = []
  private _parent: SimObject | null = null

  public getCorners(): Array<PointData> {
    const matrix = this.computeMatrix()

    return this.getBounds().getCorners().map((point) => {
      return matrix.applyToPoint(point)
    })
  }

  public getBounds(): Rectangle {
    const componentsPoints = this._components.flatMap((component) => component.getCorners())
    const childrenPoints = this._children.flatMap((child) => child.getCorners())
    const allPoints = componentsPoints.concat(childrenPoints)

    const bounds = Polygon.prototype.getBounds.call({ points: allPoints })

    return bounds
  }

  public addComponent(component: BaseComponent): void {
    this._components.push(component)
  }

  public addChild(child: SimObject): void {
    this._children.push(child)
  }

  public setParent() {

  }

  public render(context: CanvasRenderingContext2D): void {
    const matrix = this.computeMatrix()
    const bounds = this.getBounds()

    context.save()
    matrix.applyToContext(context)

    context.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height)

    this._components.map((component) => component.render(context))
    this._children.map((child) => child.render(context))

    context.restore()

    this.drawOrigins(context)
  }

  public renderHit(content: CanvasRenderingContext2D): void {
    this._components.map((component) => component.renderHit(content))
    this._children.map((child) => child.renderHit(content))
  }
}