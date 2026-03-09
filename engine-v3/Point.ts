export type PointData = {
  x: number
  y: number
}

export class Point {
  public static emptyPoint(value: number = 0): PointData {
    return {
      x: value,
      y: value,
    }
  }
  
  public static addPoints(a: PointData, b: number): PointData
  public static addPoints(a: PointData, b: PointData): PointData
  public static addPoints(a: PointData, b: PointData | number): PointData {
    if (typeof b === "number") {
      a.x += b
      a.y += b

      return a
    }

    a.x += b.x
    a.y += b.y

    return a
  }

  public static dividePoints(a: PointData, b: number): PointData
  public static dividePoints(a: PointData, b: PointData): PointData
  public static dividePoints(a: PointData, b: PointData | number): PointData {
    if (typeof b === "number") {
      a.x /= b
      a.y /= b

      return a
    }

    a.x /= b.x
    a.y /= b.y

    return a
  }

  public static subtractPoints(a: PointData, b: number): PointData
  public static subtractPoints(a: PointData, b: PointData): PointData
  public static subtractPoints(a: PointData, b: PointData | number): PointData {
    if (typeof b === "number") {
      a.x -= b
      a.y -= b

      return a
    }

    a.x -= b.x
    a.y -= b.y

    return a
  }

  public static averagePoints(points: Array<PointData>) {
    const sum = points.reduce(Point.addPoints, Point.emptyPoint())

    return Point.dividePoints(sum, points.length)
  }
}