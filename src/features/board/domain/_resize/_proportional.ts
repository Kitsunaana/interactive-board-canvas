import { _u, isNegative } from "@/shared/lib/utils"
import type { Point } from "@/shared/type/shared"
import { SELECTION_BOUNDS_PADDING } from "../../ui/selection-bounds-area"
import type { Shape } from "../_shape"

type ApplyEdgeResize = (params: { canvasPoint: Point, shape: Shape }) => Shape

export const applyRightEdgeResize: ApplyEdgeResize = ({ shape, canvasPoint }) => {
  const rightEdgeX = shape.x + shape.width
  const deltaX = canvasPoint.x - rightEdgeX - SELECTION_BOUNDS_PADDING

  const nextWidth = shape.width + deltaX
  const aspectRatio = shape.height / shape.width

  if (isNegative(nextWidth)) {
    const overshoot = Math.abs(nextWidth)

    if (overshoot < SELECTION_BOUNDS_PADDING * 2) {
      return _u.merge(shape, {
        width: 0,
        height: 0,
      })
    }

    const width = overshoot - SELECTION_BOUNDS_PADDING * 2
    const height = width * aspectRatio

    return _u.merge(shape, {
      x: shape.x - width,
      width,
      height,
    })
  }

  return _u.merge(shape, {
    width: nextWidth,
    height: nextWidth * aspectRatio,
  })
}

export const applyLeftEdgeResize: ApplyEdgeResize = ({ shape, canvasPoint }) => {
  const leftEdgeX = shape.x
  const deltaX = leftEdgeX - canvasPoint.x - SELECTION_BOUNDS_PADDING

  const nextWidth = shape.width + deltaX
  const aspectRatio = shape.height / shape.width

  if (isNegative(nextWidth)) {
    const overshoot = Math.abs(nextWidth)

    if (overshoot < SELECTION_BOUNDS_PADDING * 2) {
      return _u.merge(shape, {
        x: shape.x + shape.width,
        width: 0,
        height: 0,
      })
    }

    const width = overshoot - SELECTION_BOUNDS_PADDING * 2
    const height = width * aspectRatio

    return _u.merge(shape, {
      x: shape.x + shape.width,
      width,
      height,
    })
  }

  return _u.merge(shape, {
    x: shape.x - deltaX,
    width: nextWidth,
    height: nextWidth * aspectRatio,
  })
}

export const applyBottomEdgeResize: ApplyEdgeResize = ({ shape, canvasPoint }) => {
  const bottomEdgeY = shape.y + shape.height
  const deltaY = canvasPoint.y - bottomEdgeY - SELECTION_BOUNDS_PADDING

  const nextHeight = shape.height + deltaY
  const aspectRatio = shape.width / shape.height

  if (isNegative(nextHeight)) {
    const overshoot = Math.abs(nextHeight)

    if (overshoot < SELECTION_BOUNDS_PADDING * 2) {
      return _u.merge(shape, {
        width: 0,
        height: 0,
      })
    }

    const height = overshoot - SELECTION_BOUNDS_PADDING * 2
    const width = height * aspectRatio

    return _u.merge(shape, {
      y: shape.y - height,
      width,
      height,
    })
  }

  return _u.merge(shape, {
    width: nextHeight * aspectRatio,
    height: nextHeight,
  })
}

export const applyTopEdgeResize: ApplyEdgeResize = ({ shape, canvasPoint }) => {
  const topEdgeY = shape.y
  const deltaY = topEdgeY - canvasPoint.y - SELECTION_BOUNDS_PADDING

  const nextHeight = shape.height + deltaY
  const aspectRatio = shape.width / shape.height

  if (isNegative(nextHeight)) {
    const overshoot = Math.abs(nextHeight)

    if (overshoot < SELECTION_BOUNDS_PADDING * 2) {
      return _u.merge(shape, {
        y: shape.y + shape.height,
        height: 0,
        width: 0,
      })
    }

    const height = overshoot - SELECTION_BOUNDS_PADDING * 2
    const width = height * aspectRatio

    return _u.merge(shape, {
      y: shape.y + shape.height,
      width,
      height,
    })
  }

  return _u.merge(shape, {
    y: shape.y - deltaY,
    width: nextHeight * aspectRatio,
    height: nextHeight,
  })
}

export const proportionalResizeHandlers = {
  applyBottomEdgeResize,
  applyRightEdgeResize,
  applyLeftEdgeResize,
  applyTopEdgeResize,
}