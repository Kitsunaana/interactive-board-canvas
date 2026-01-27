/**
 * Вся математика кода была взята из ответа со stack-overflow.
 * https://stackoverflow.com/questions/40650306/how-to-draw-a-smooth-continuous-line-with-mouse-using-html-canvas-and-javascript
 */

// the Ramer–Douglas–Peucker algorithm
// referance https://en.wikipedia.org/wiki/Ramer%E2%80%93Douglas%E2%80%93Peucker_algorithm
export const simplifyLineRDP = (points: number[][], length: number) => {
  const simplify = (start: number, end: number) => {
    let i: number
    let dx: number
    let dy: number

    let maxDist = length
    let index = 0
    let p1 = points[start]
    let p2 = points[end]
    let xx = p1[0]
    let yy = p1[1]
    let ddx = p2[0] - xx
    let ddy = p2[1] - yy
    let dist1 = (ddx * ddx + ddy * ddy)

    let p: number[]
    let t: number
    let dist: number

    for (i = start + 1; i < end; i++) {
      p = points[i]

      if (ddx !== 0 || ddy !== 0) {
        t = ((p[0] - xx) * ddx + (p[1] - yy) * ddy) / dist1

        if (t > 1) {
          dx = p[0] - p2[0]
          dy = p[1] - p2[1]
        } else {
          if (t > 0) {
            dx = p[0] - (xx + ddx * t)
            dy = p[1] - (yy + ddy * t)
          } else {
            dx = p[0] - xx
            dy = p[1] - yy
          }
        }
      } else {
        dx = p[0] - xx
        dy = p[1] - yy
      }

      dist = dx * dx + dy * dy

      if (dist > maxDist) {
        index = i
        maxDist = dist
      }
    }

    if (maxDist > length) {
      if (index - start > 1) simplify(start, index)

      newLine.push(points[index])

      if (end - index > 1) simplify(index, end)
    }
  }

  const end = points.length - 1
  const newLine = [points[0]]

  simplify(0, end)

  newLine.push(points[end])

  return newLine
}

export const smoothLine = (points: number[][], cornerThres: number, match: boolean) => {
  let x: number
  let y: number
  let len: number
  let angle: number
  let i: number
  let aLen: number
  let closed: boolean

  let np: number[]
  let p1: number[]
  let p2: number[]
  let p3: number[]
  let endP: number[]
  let newPoints: number[][]

  let dist1 = 0
  let dist2 = 0
  let nx1 = 0
  let nx2 = 0
  let ny1 = 0
  let ny2 = 0

  const dot = (x: number, y: number, xx: number, yy: number) => {
    dist1 = Math.sqrt(x * x + y * y)

    if (dist1 > 0) {
      nx1 = x / dist1
      ny1 = y / dist1
    } else {
      nx1 = 1
      ny1 = 0
    }

    dist2 = Math.sqrt(xx * xx + yy * yy)

    if (dist2 > 0) {
      nx2 = xx / dist2
      ny2 = yy / dist2
    } else {
      nx2 = 1
      ny2 = 0
    }

    return Math.acos(nx1 * nx2 + ny1 * ny2)
  }

  newPoints = []
  aLen = points.length

  if (aLen <= 2) {
    for (i = 0; i < aLen; i++) {
      newPoints.push([points[i][0], points[i][1]])
    }

    return newPoints
  }

  p1 = points[0]
  endP = points[aLen - 1]
  i = 0
  closed = false
  len = Math.hypot(p1[0] - endP[0], p1[1] - endP[1])

  if (len < Math.SQRT2) {
    endP = p1
    i = 0
    p1 = points[aLen - 2]
    closed = true
  }

  newPoints.push([points[i][0], points[i][1]])

  for (; i < aLen - 1; i++) {
    p2 = points[i]
    p3 = points[i + 1]
    angle = Math.abs(dot(p2[0] - p1[0], p2[1] - p1[1], p3[0] - p2[0], p3[1] - p2[1]));

    if (dist1 !== 0) {
      if (angle < cornerThres * 3.14) {
        if (match) {
          dist1 = Math.min(dist1, dist2)
          dist2 = dist1
        }

        x = (nx1 + nx2) / 2
        y = (ny1 + ny2) / 2
        len = Math.sqrt(x * x + y * y)

        if (len === 0) {
          newPoints.push([p2[0], p2[1]])
        } else {
          x /= len
          y /= len

          if (newPoints.length > 0) {
            np = newPoints[newPoints.length - 1]
            np.push(p2[0] - x * dist1 * 0.25)
            np.push(p2[1] - y * dist1 * 0.25)
          }

          newPoints.push([
            p2[0],
            p2[1],
            p2[0] + x * dist2 * 0.25,
            p2[1] + y * dist2 * 0.25
          ])
        }
      } else {
        newPoints.push([p2[0], p2[1]])
      }
    }

    p1 = p2
  }

  if (closed) {
    p1 = []

    for (i = 0; i < newPoints[0].length; i++) {
      p1.push(newPoints[0][i])
    }

    newPoints.push(p1)
  } else {
    newPoints.push([points[points.length - 1][0], points[points.length - 1][1]])
  }

  return newPoints
}

export const drawSmoothedLine = (context: CanvasRenderingContext2D, line: number[][]) => {
  let i: number
  let p: number[] = []
  let p1: number[] = []

  context.beginPath()
  context.moveTo(line[0][0], line[0][1])

  for (i = 0; i < line.length - 1; i++) {
    p = line[i]
    p1 = line[i + 1]

    if (p.length === 2) {
      context.lineTo(p[0], p[1])
    } else {
      if (p.length === 4) {
        context.quadraticCurveTo(p[2], p[3], p1[0], p1[1])
      } else {
        context.bezierCurveTo(p[2], p[3], p[4], p[5], p1[0], p1[1])
      }
    }
  }

  if (p.length === 2) {
    context.lineTo(p1[0], p1[1])
  }

  context.stroke()
  context.closePath()
}
