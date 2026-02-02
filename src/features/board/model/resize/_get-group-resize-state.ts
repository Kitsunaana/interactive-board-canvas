import type { Point, Rect, RotatableRect } from "@/shared/type/shared"
import type { Bound } from "../../domain/selection-area"

export type GroupResizeState = {
  pivotX: number
  pivotY: number
  initialWidth: number
  initialHeight: number
  shapes: Array<{
    id: string
    centerX: number
    centerY: number
    offsetX: number
    offsetY: number
    width: number
    height: number
    rotate: number

    points?: Point[]
  }>
}

const createGroupFromBoundResizeStateFactory = ({ getOffset, getPivot }: {
  getOffset: (center: Point, pivot: Point) => Point,
  getPivot: (area: Rect) => Point,
}) => {
  return (shapes: RotatableRect<true>[], area: Rect): GroupResizeState => {
    const pivot = getPivot(area)

    const pivotX = pivot.x
    const pivotY = pivot.y

    return {
      pivotX,
      pivotY,
      initialWidth: area.width,
      initialHeight: area.height,
      shapes: shapes.map(shape => {
        const centerX = shape.x + shape.width / 2
        const centerY = shape.y + shape.height / 2

        const offset = getOffset({ x: centerX, y: centerY }, pivot)

        return {
          id: shape.id,
          centerX,
          centerY,
          width: shape.width,
          height: shape.height,
          rotate: shape.rotate,
          offsetX: offset.x,
          offsetY: offset.y,
          points: "points" in shape && Array.isArray(shape.points)
            ? shape.points
            : undefined,
        }
      }),
    }
  }
}

// export const createGroupRightResizeState = createGroupFromBoundResizeStateFactory({
//   getPivot: (area) => ({
//     x: area.x,
//     y: area.y,
//   }),
//   getOffset: (center, pivot) => ({
//     x: center.x - pivot.x,
//     y: center.y - pivot.y,
//   })
// })

export const createGroupRightResizeState = createGroupFromBoundResizeStateFactory({
  getPivot: (area) => ({
    x: area.x,
    y: area.y + area.height / 2,
  }),
  getOffset: (center, pivot) => ({
    x: center.x - pivot.x,
    y: center.y - pivot.y,
  })
})

// export const createGroupBottomResizeState = createGroupFromBoundResizeStateFactory({
//   getPivot: (area) => ({
//     x: area.x,
//     y: area.y,
//   }),
//   getOffset: (center, pivot) => ({
//     x: center.x - pivot.x,
//     y: center.y - pivot.y,
//   })
// })

export const createGroupBottomResizeState = createGroupFromBoundResizeStateFactory({
  getPivot: (area) => ({
    x: area.x + area.width / 2,
    y: area.y,
  }),
  getOffset: (center, pivot) => ({
    x: center.x - pivot.x,
    y: center.y - pivot.y,
  })
})

// export const createGroupTopResizeState = createGroupFromBoundResizeStateFactory({
//   getPivot: (area) => ({
//     x: area.x,
//     y: area.y + area.height,
//   }),
//   getOffset: (center, pivot) => ({
//     x: pivot.x - center.x,
//     y: pivot.y - center.y,
//   })
// })

export const createGroupTopResizeState = createGroupFromBoundResizeStateFactory({
  getPivot: (area) => ({
    x: area.x + area.width / 2,
    y: area.y + area.height,
  }),
  getOffset: (center, pivot) => ({
    x: pivot.x - center.x,
    y: pivot.y - center.y,
  })
})

// export const createGroupLeftResizeState = createGroupFromBoundResizeStateFactory({
//   getPivot: (area) => ({
//     x: area.x + area.width,
//     y: area.y,
//   }),
//   getOffset: (center, pivot) => ({
//     x: pivot.x - center.x,
//     y: pivot.y - center.y,
//   })
// })

export const createGroupLeftResizeState = createGroupFromBoundResizeStateFactory({
  getPivot: (area) => ({
    x: area.x + area.width,
    y: area.y + area.height / 2,
  }),
  getOffset: (center, pivot) => ({
    x: pivot.x - center.x,
    y: pivot.y - center.y,
  })
})

export const createGroupFromBoundResizeState: Record<Bound, (shapes: RotatableRect<true>[], area: Rect) => GroupResizeState> = {
  bottom: createGroupBottomResizeState,
  right: createGroupRightResizeState,
  left: createGroupLeftResizeState,
  top: createGroupTopResizeState,
}