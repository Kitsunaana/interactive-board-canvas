import type { Point, Rect, RotatableRect } from "@/shared/type/shared"

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
    x: number
    y: number

    points?: Point[]
  }>
}

export const createGroupFromBoundResizeStateFactory = ({ getOffset, getPivot }: {
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
          x: shape.x,
          y: shape.y,
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

export const createGroupReflowState = {
  bottomRight: {},

  bottomLeft: {},

  topRight: {},

  topLeft: {},

  bottom: {
    independent: createGroupFromBoundResizeStateFactory({
      getPivot: (area) => ({ x: area.x + area.width / 2, y: area.y + area.height / 2 }),
      getOffset: (center, pivot) => ({ x: center.x - pivot.x, y: center.y - pivot.y }),
    }),

    proportional: createGroupFromBoundResizeStateFactory({
      getPivot: (area) => ({ x: area.x + area.width / 2, y: area.y }),
      getOffset: (center, pivot) => ({ x: center.x - pivot.x, y: center.y - pivot.y }),
    })
  },

  right: {
    independent: createGroupFromBoundResizeStateFactory({
      getPivot: (area) => ({ x: area.x + area.width / 2, y: area.y + area.height / 2 }),
      getOffset: (center, pivot) => ({ x: center.x - pivot.x, y: center.y - pivot.y }),
    }),

    proportional: createGroupFromBoundResizeStateFactory({
      getPivot: (area) => ({ x: area.x, y: area.y + area.height / 2 }),
      getOffset: (center, pivot) => ({ x: center.x - pivot.x, y: center.y - pivot.y }),
    }),
  },

  left: {
    independent: createGroupFromBoundResizeStateFactory({
      getPivot: (area) => ({ x: area.x + area.width / 2, y: area.y + area.height / 2 }),
      getOffset: (center, pivot) => ({ x: center.x - pivot.x, y: center.y - pivot.y }),
    }),

    proportional: createGroupFromBoundResizeStateFactory({
      getPivot: (area) => ({ x: area.x + area.width, y: area.y + area.height / 2 }),
      getOffset: (center, pivot) => ({ x: center.x - pivot.x, y: center.y - pivot.y }),
    }),
  },

  top: {
    independent: createGroupFromBoundResizeStateFactory({
      getPivot: (area) => ({ x: area.x + area.width / 2, y: area.y + area.height / 2 }),
      getOffset: (center, pivot) => ({ x: center.x - pivot.x, y: center.y - pivot.y }),
    }),

    proportional: createGroupFromBoundResizeStateFactory({
      getPivot: (area) => ({ x: area.x + area.width / 2, y: area.y + area.height }),
      getOffset: (center, pivot) => ({ x: center.x - pivot.x, y: center.y - pivot.y }),
    })
  },
}

export const createGroupResizeState = {
  bottomRight: {
    independent: createGroupFromBoundResizeStateFactory({
      getPivot: (area) => ({ x: area.x, y: area.y }),
      getOffset: (center, pivot) => ({ x: center.x - pivot.x, y: center.y - pivot.y })
    }),

    proportional: createGroupFromBoundResizeStateFactory({
      getPivot: (area) => ({ x: area.x, y: area.y }),
      getOffset: (center, pivot) => ({ x: center.x - pivot.x, y: center.y - pivot.y })
    }),
  },

  bottomLeft: {
    independent: createGroupFromBoundResizeStateFactory({
      getPivot: (area) => ({ x: area.x + area.width, y: area.y }),
      getOffset: (center, pivot) => ({ x: center.x - pivot.x, y: center.y - pivot.y })
    }),

    proportional: createGroupFromBoundResizeStateFactory({
      getPivot: (area) => ({ x: area.x + area.width, y: area.y }),
      getOffset: (center, pivot) => ({ x: center.x - pivot.x, y: center.y - pivot.y })
    }),
  },

  topRight: {
    independent: createGroupFromBoundResizeStateFactory({
      getPivot: (area) => ({ x: area.x, y: area.y + area.height }),
      getOffset: (center, pivot) => ({ x: center.x - pivot.x, y: pivot.y - center.y })
    }),

    proportional: createGroupFromBoundResizeStateFactory({
      getPivot: (area) => ({ x: area.x, y: area.y + area.height }),
      getOffset: (center, pivot) => ({ x: center.x - pivot.x, y: center.y - pivot.y })
    }),
  },

  topLeft: {
    independent: createGroupFromBoundResizeStateFactory({
      getPivot: (area) => ({ x: area.x + area.width, y: area.y + area.height }),
      getOffset: (center, pivot) => ({ x: pivot.x - center.x, y: pivot.y - center.y })
    }),

    proportional: createGroupFromBoundResizeStateFactory({
      getPivot: (area) => ({ x: area.x + area.width, y: area.y + area.height }),
      getOffset: (center, pivot) => ({ x: center.x - pivot.x, y: center.y - pivot.y })
    }),
  },

  bottom: {
    independent: createGroupFromBoundResizeStateFactory({
      getPivot: (area) => ({ x: area.x, y: area.y }),
      getOffset: (center, pivot) => ({ x: center.x - pivot.x, y: center.y - pivot.y })
    }),
    proportional: createGroupFromBoundResizeStateFactory({
      getPivot: (area) => ({ x: area.x + area.width / 2, y: area.y }),
      getOffset: (center, pivot) => ({ x: center.x - pivot.x, y: center.y - pivot.y })
    }),
  },

  right: {
    independent: createGroupFromBoundResizeStateFactory({
      getPivot: (area) => ({ x: area.x, y: area.y }),
      getOffset: (center, pivot) => ({ x: center.x - pivot.x, y: center.y - pivot.y })
    }),

    proportional: createGroupFromBoundResizeStateFactory({
      getPivot: (area) => ({ x: area.x, y: area.y + area.height / 2 }),
      getOffset: (center, pivot) => ({ x: center.x - pivot.x, y: center.y - pivot.y })
    }),
  },

  left: {
    independent: createGroupFromBoundResizeStateFactory({
      getPivot: (area) => ({ x: area.x + area.width, y: area.y }),
      getOffset: (center, pivot) => ({ x: pivot.x - center.x, y: pivot.y - center.y })
    }),

    proportional: createGroupFromBoundResizeStateFactory({
      getPivot: (area) => ({ x: area.x + area.width, y: area.y + area.height / 2 }),
      getOffset: (center, pivot) => ({ x: pivot.x - center.x, y: pivot.y - center.y })
    }),
  },

  top: {
    independent: createGroupFromBoundResizeStateFactory({
      getPivot: (area) => ({ x: area.x, y: area.y + area.height }),
      getOffset: (center, pivot) => ({ x: pivot.x - center.x, y: pivot.y - center.y })
    }),

    proportional: createGroupFromBoundResizeStateFactory({
      getPivot: (area) => ({ x: area.x + area.width / 2, y: area.y + area.height }),
      getOffset: (center, pivot) => ({ x: pivot.x - center.x, y: pivot.y - center.y })
    }),
  },
}