import { initialCanvas } from "../../setup"
import type { LimitMapPoints, Node, Sizes } from "../../type"
import { getCanvasSizes } from "../../utils"
import { sizesToPoint } from "../camera"
import { MINI_MAP_SIZES, MINI_MAP_UNSCALE } from "./const"

export const findLimitMapPointsV2 = ({ nodes, miniMapSizes }: {
    miniMapSizes: Sizes
    nodes: Node[]
}) => (
    nodes.reduce(
        (foundPoints, node) => {
            foundPoints.min.x = Math.min(foundPoints.min.x, node.x + node.width)
            foundPoints.min.y = Math.min(foundPoints.min.y, node.y + node.height)
            foundPoints.max.x = Math.max(foundPoints.max.x, node.x + node.width)
            foundPoints.max.y = Math.max(foundPoints.max.y, node.y + node.height)

            return foundPoints
        },
        {
            max: sizesToPoint(miniMapSizes),
            min: {
                x: nodes[0].x,
                y: nodes[0].y
            },
        } as LimitMapPoints
    )
)

export const updateMiniMapSizes = () => {
    const canvasSizes = getCanvasSizes()

    return {
        height: Math.round(canvasSizes.height / MINI_MAP_UNSCALE),
        width: Math.round(canvasSizes.width / MINI_MAP_UNSCALE),
    }
}

export const calculateUnscaleMap = ({
    miniMapSizes,
    nodes
}: Parameters<typeof findLimitMapPointsV2>[0]) => {
    const foundMapPoints = findLimitMapPointsV2({ miniMapSizes, nodes })
    const { min, max } = foundMapPoints

    const maxPointX = Math.max(min.x, max.x)
    const maxPointY = Math.max(min.y, max.y)

    const unscaleX = maxPointX / miniMapSizes.width
    const unscaleY = maxPointY / miniMapSizes.height

    return unscaleX > unscaleY ? unscaleX : unscaleY
}

export const [context, canvas] = initialCanvas({
    ...MINI_MAP_SIZES,
    canvasId: "map",
})
