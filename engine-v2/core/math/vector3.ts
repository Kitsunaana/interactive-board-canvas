export class Vector3 {
  public constructor(private _x: number = 0, private _y: number = 0, private _z: number = 0) {}

  public get x() {
    return this._x
  }

  public set x(value: number) {
    this._x = value
  }

  public get y() {
    return this._y
  }

  public set y(value: number) {
    this._y = value
  }

  public get z() {
    return this._z
  }

  public set z(value: number) {
    this._z = value
  }

  public toArray(): Array<number> {
    return [this._x, this._y, this._z]
  }

  public toFloat32Array(): Float32Array {
    return new Float32Array(this.toArray())
  }

  public static get zero(): Vector3 {
    return new Vector3(0, 0, 0)
  }

  public static get one(): Vector3  {
    return new Vector3(1, 1, 1)
  }

  public copyFrom(vector: Vector3): void {
    this._x = vector._x
    this._y = vector._y
    this._z = vector._z
  }
}