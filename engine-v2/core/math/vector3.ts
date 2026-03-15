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
}