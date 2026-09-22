import { Point, type PointData } from "../maths"

export interface Node {
  anchor: PointData
  inHandle: PointData
  outHandle: PointData
}

export interface CubicBezierSegmentData {
  start: Node
  end: Node
}

export function lerp(a: PointData, b: PointData, t: number): Point {
  return new Point(
    a.x + (b.x - a.x) * t,
    a.y + (b.y - a.y) * t,
  )
}

export function splitCubicBezierSegment(segment: CubicBezierSegmentData, t: number) {
  const p0 = segment.start.anchor
  const p1 = segment.start.outHandle
  const p2 = segment.end.inHandle
  const p3 = segment.end.anchor

  const p01 = lerp(p0, p1, t)
  const p12 = lerp(p1, p2, t)
  const p23 = lerp(p2, p3, t)

  const p012 = lerp(p01, p12, t)
  const p123 = lerp(p12, p23, t)

  const splitPoint = lerp(p012, p123, t)

  const left: CubicBezierSegmentData = {
    start: {
      anchor: segment.start.anchor,
      inHandle: segment.start.inHandle,
      outHandle: p01,
    },
    end: {
      anchor: splitPoint,
      inHandle: p012,
      outHandle: p123,
    },
  }

  const right: CubicBezierSegmentData = {
    start: {
      anchor: splitPoint,
      inHandle: p012,
      outHandle: p123,
    },
    end: {
      anchor: segment.end.anchor,
      inHandle: p23,
      outHandle: segment.end.outHandle,
    },
  };

  return [left, right];
}

export function findClosestT(P0: Point, P1: Point, P2: Point, P3: Point, position: Point): number {
  const evalBezier = (t: number): Point => {
    const u = 1 - t
    return P0.scale(u * u * u)
      .add(P1.scale(3 * u * u * t))
      .add(P2.scale(3 * u * t * t))
      .add(P3.scale(t * t * t))
  }

  let bestT = 0.5
  let bestDist = Infinity

  const samples = 100
  for (let i = 0; i <= samples; i++) {
    const t = i / samples
    const dist = evalBezier(t).sub(position).lengthSquared()
    if (dist < bestDist) {
      bestDist = dist
      bestT = t
    }
  }

  let lo = Math.max(0, bestT - 1 / samples)
  let hi = Math.min(1, bestT + 1 / samples)

  for (let i = 0; i < 12; i++) {
    const mid = (lo + hi) / 2
    const distLo = evalBezier(lo).sub(position).lengthSquared()
    const distMid = evalBezier(mid).sub(position).lengthSquared()
    const distHi = evalBezier(hi).sub(position).lengthSquared()

    if (distLo <= distMid && distLo <= distHi) {
      hi = mid
    } else if (distHi <= distMid && distHi <= distLo) {
      lo = mid
    } else {
      lo = (lo + mid) / 2
      hi = (mid + hi) / 2
    }
  }

  return (lo + hi) / 2
}

export function computeHandleOffsets(delta: Point, t: number) {
  const u = 1 - t

  const wLeft = u
  const wRight = t

  const denom = 3 * t * u * (u * u + t * t)
  const maxScale = 50
  const scaleFactor = denom > 0.0001 ? Math.min(1 / denom, maxScale) : maxScale
  const S = delta.scale(scaleFactor)

  const dLeft = S.scale(wLeft)
  const dRight = S.scale(wRight)

  return [dLeft, dRight]
}
