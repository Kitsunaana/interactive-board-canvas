import { _u, isNegative } from "@/shared/lib/utils"
import type { Point } from "@/shared/type/shared"
import { SELECTION_BOUNDS_PADDING } from "../../ui/selection-bounds-area"
import type { Shape } from "../_shape"

type ApplyEdgeResize = (params: { canvasPoint: Point, shape: Shape }) => Shape

const applyRightEdgeResize: ApplyEdgeResize = ({ shape, canvasPoint }) => {
  const rightEdgeX = shape.x + shape.width
  const sizeDelta = canvasPoint.x - rightEdgeX - SELECTION_BOUNDS_PADDING
  const projectedSize = shape.width + sizeDelta

  if (isNegative(projectedSize)) {
    const overshoot = Math.abs(projectedSize)

    if (overshoot < SELECTION_BOUNDS_PADDING * 2) {
      return _u.merge(shape, {
        width: 0,
        height: 0,
      })
    }

    const size = overshoot - SELECTION_BOUNDS_PADDING * 2

    return _u.merge(shape, {
      x: shape.x - size,
      width: size,
      height: size,
    })
  }

  return _u.merge(shape, {
    width: projectedSize,
    height: projectedSize,
  })
}

const applyLeftEdgeResize: ApplyEdgeResize = ({ shape, canvasPoint }) => {
  const sizeDelta = shape.x - canvasPoint.x - SELECTION_BOUNDS_PADDING
  const nextSize = shape.width + sizeDelta

  if (isNegative(nextSize)) {
    const overshoot = Math.abs(nextSize)

    if (overshoot < SELECTION_BOUNDS_PADDING * 2) {
      return _u.merge(shape, {
        x: shape.x + shape.width,
        width: 0,
        height: 0,
      })
    }

    const size = overshoot - SELECTION_BOUNDS_PADDING * 2

    return _u.merge(shape, {
      x: shape.x + shape.width,
      width: size,
      height: size,
    })
  }

  return _u.merge(shape, {
    x: shape.x - sizeDelta,
    width: nextSize,
    height: nextSize,
  })
}

const applyBottomEdgeResize: ApplyEdgeResize = ({ shape, canvasPoint }) => {
  const heightDelta = canvasPoint.y - shape.y - SELECTION_BOUNDS_PADDING

  if (isNegative(heightDelta)) {
    const overshoot = Math.abs(heightDelta)

    if (overshoot < SELECTION_BOUNDS_PADDING * 2) {
      return _u.merge(shape, {
        width: 0,
        height: 0,
      })
    }

    const size = overshoot - SELECTION_BOUNDS_PADDING * 2

    return _u.merge(shape, {
      y: shape.y - size,
      width: size,
      height: size,
    })
  }

  return _u.merge(shape, {
    width: heightDelta,
    height: heightDelta,
  })
}

const applyTopEdgeResize: ApplyEdgeResize = ({ shape, canvasPoint }) => {
  const sizeDelta = shape.y - canvasPoint.y - SELECTION_BOUNDS_PADDING
  const nextSize = shape.height + sizeDelta

  if (isNegative(nextSize)) {
    const overshoot = Math.abs(nextSize)

    if (overshoot < SELECTION_BOUNDS_PADDING * 2) {
      return _u.merge(shape, {
        y: shape.y + shape.height,
        width: 0,
        height: 0,
      })
    }

    const size = overshoot - SELECTION_BOUNDS_PADDING * 2

    return _u.merge(shape, {
      y: shape.y + shape.height,
      width: size,
      height: size,
    })
  }

  return _u.merge(shape, {
    y: shape.y - sizeDelta,
    width: nextSize,
    height: nextSize,
  })
}

export const proportionalResizeHandlers = {
  applyBottomEdgeResize,
  applyRightEdgeResize,
  applyLeftEdgeResize,
  applyTopEdgeResize,
}