import type { Shape } from "@/features/board/domain/dto"
import { SELECTION_BOUNDS_PADDING } from "@/features/board/ui/active-box"
import { isNegative, _u } from "@/shared/lib/utils"
import type { Point } from "@/shared/type/shared"

type ApplyEdgeResize = (params: { canvasPoint: Point, shape: Shape }) => Shape

const applyRightEdgeResize: ApplyEdgeResize = ({ shape, canvasPoint }) => {
  const rightEdgeX = shape.x + shape.width
  const resizeOffset = canvasPoint.x - rightEdgeX - SELECTION_BOUNDS_PADDING

  const nextWidth = shape.width + resizeOffset

  if (isNegative(nextWidth)) {
    const overflow = Math.abs(resizeOffset) - shape.width - (SELECTION_BOUNDS_PADDING * 2)

    if (overflow < 0) return _u.merge(shape, { width: 0 })

    return _u.merge(shape, {
      x: shape.x - overflow,
      width: overflow,
    })
  }

  return _u.merge(shape, { width: nextWidth })
}

const applyLeftEdgeResize: ApplyEdgeResize = ({ canvasPoint, shape }) => {
  const pointerOffsetX = shape.x - canvasPoint.x - SELECTION_BOUNDS_PADDING
  const projectedWidth = shape.width + pointerOffsetX

  if (isNegative(projectedWidth)) {
    const overshoot = Math.abs(projectedWidth)

    if (overshoot < (SELECTION_BOUNDS_PADDING * 2)) {
      return _u.merge(shape, {
        x: shape.x + shape.width,
        width: 0,
      })
    }

    return _u.merge(shape, {
      x: shape.x + shape.width,
      width: overshoot - (SELECTION_BOUNDS_PADDING * 2),
    })
  }

  return _u.merge(shape, {
    x: shape.x - pointerOffsetX,
    width: projectedWidth,
  })
}

const applyBottomEdgeResize: ApplyEdgeResize = ({ shape, canvasPoint }) => {
  const heightDelta = canvasPoint.y - shape.y - SELECTION_BOUNDS_PADDING

  if (isNegative(heightDelta)) {
    const overshoot = Math.abs(heightDelta)

    if (overshoot < (SELECTION_BOUNDS_PADDING * 2)) return _u.merge(shape, { height: 0 })

    const adjustedHeight = overshoot - (SELECTION_BOUNDS_PADDING * 2)

    return _u.merge(shape, {
      y: shape.y - adjustedHeight,
      height: adjustedHeight,
    })
  }

  return _u.merge(shape, {
    height: heightDelta,
  })
}

const applyTopEdgeResize: ApplyEdgeResize = ({ shape, canvasPoint }) => {
  const heightDelta = shape.y - canvasPoint.y - SELECTION_BOUNDS_PADDING
  const projectedHeight = shape.height + heightDelta

  if (isNegative(projectedHeight)) {
    const overshoot = Math.abs(projectedHeight)

    if (overshoot < (SELECTION_BOUNDS_PADDING * 2)) {
      return _u.merge(shape, {
        y: shape.y + shape.height,
        height: 0,
      })
    }

    const adjustedHeight = overshoot - (SELECTION_BOUNDS_PADDING * 2)

    return _u.merge(shape, {
      y: shape.y + shape.height,
      height: adjustedHeight,
    })
  }

  return _u.merge(shape, {
    y: shape.y - heightDelta,
    height: projectedHeight,
  })
}

export const independentResizeHandlers = {
  applyBottomEdgeResize,
  applyRightEdgeResize,
  applyLeftEdgeResize,
  applyTopEdgeResize,
}