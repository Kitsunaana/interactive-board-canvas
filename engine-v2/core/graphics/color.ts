export class Color {
  public constructor(
    private _r: number = 255,
    private _g: number = 255,
    private _b: number = 255,
    private _a: number = 255,
  ) { }

  public get r(): number {
    return this._r
  }

  public get rFloat(): number {
    return this._r / 255.0
  }

  public set r(value: number) {
    this._r = value
  }

  public get g(): number {
    return this._g
  }

  public get gFloat(): number {
    return this._g / 255.0
  }

  public set g(value: number) {
    this._g = value
  }

  public get b(): number {
    return this._b
  }

  public get bFloat(): number {
    return this._b / 255.0
  }

  public set b(value: number) {
    this._b = value
  }

  public get a(): number {
    return this._a
  }

  public get aFloat(): number {
    return this._a / 255.0
  }

  public set a(value: number) {
    this._a = value
  }

  public toArray(): Array<number> {
    return [this._r, this._g, this._b, this._a]
  }

  public toFloatArray(): Array<number> {
    return [this.rFloat, this.gFloat, this.bFloat, this.aFloat]
  }

  public toFloat32Array(): Float32Array {
    return new Float32Array(this.toFloatArray())
  }

  public static white() {
    return new Color(255, 255, 255, 255)
  }

  public static black() {
    return new Color(0, 0, 0, 255)
  }

  public static red() {
    return new Color(255, 0, 0, 255)
  }

  public static green() {
    return new Color(0, 255, 0, 255)
  }

  public static blue() {
    return new Color(0, 0, 255, 255)
  }
}