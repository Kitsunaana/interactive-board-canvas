import { Matrix4x4 } from "../math/matrix4x4"
import { Transform } from "../math/transform"
import { Shader } from "../gl/shader"
import { Scene } from "./scene"
import { BaseComponent } from "../components/base-component"

export class SimObject {
  private _children: Array<SimObject> = []
  private _parent: SimObject | null = null
  private _isLoaded: boolean = false
  private _components: Array<BaseComponent> = []

  private _localMatrix: Matrix4x4 = Matrix4x4.identity()
  private _worldMatrix: Matrix4x4 = Matrix4x4.identity()

  public transform: Transform = new Transform()

  public constructor(
    private readonly _id: number,
    private readonly _name: string,
    private _scene: Scene | null = null
  ) { }

  public get id() {
    return this._id
  }

  public get parent(): SimObject | null {
    return this._parent
  }

  public get worldMatrix(): Matrix4x4 {
    return this._worldMatrix
  }

  public get isLoaded(): boolean {
    return this._isLoaded
  }

  public addChild(child: SimObject): void {
    child._parent = this

    this._children.push(child)
    child.onAdded(this._scene!)
  }

  public removeChild(child: SimObject): void {
    const index = this._children.indexOf(child)

    if (index !== -1) {
      this._children.splice(index, 1)
      child._parent = null
    }
  }

  public getObjectByName(name: string): SimObject | null {
    if (this._name === name) return this

    for (const child of this._children) {
      const found = child.getObjectByName(name)

      if (found !== null) {
        return found
      }
    }

    return null
  }

  public addComponent(component: BaseComponent): void {
    this._components.push(component)
    component.setOwner(this)
  }

  public load(): void {
    this._isLoaded = true

    for (const component of this._components) {
      component.load()
    }

    for (const child of this._children) {
      child.load()
    }
  }

  public update(time: number): void {
    this._localMatrix = this.transform.getTransformationMatrix()
    this._updateWorldMatrix(this._parent !== null ? this._parent.worldMatrix : undefined)

    for (const component of this._components) {
      component.update(time)
    }

    for (const child of this._children) {
      child.update(time)
    }
  }

  public render(shader: Shader): void {
    for (const component of this._components) {
      component.render(shader)
    }

    for (const child of this._children) {
      child.render(shader)
    }
  }

  protected onAdded(scene: Scene): void {
    this._scene = scene
  }

  private _updateWorldMatrix(parentWorldMatrix: Matrix4x4 | undefined): void {
    if (parentWorldMatrix !== undefined) {
      this._worldMatrix = Matrix4x4.multiply(parentWorldMatrix, this._localMatrix)
    } else {
      this._worldMatrix.copyFrom(this._localMatrix)
    }
  }
}