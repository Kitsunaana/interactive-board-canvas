export class Vector2 {
  public constructor(public x: number = 0, public y: number = 0) {}

  public toArray(): Array<number> {
    return [this.x, this.y]
  }

  public toFloat32Array(): Float32Array {
    return new Float32Array(this.toArray())
  }
}