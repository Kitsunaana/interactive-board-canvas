import type { Background } from "engine/world/BG"
import type { NodeViewModel, ShapeViewModel } from "./states/interface"
import { useCallback, useState } from "react"
import { nanoid } from "nanoid"

export const useNodesModel = ({ getLayer }: { getLayer: () => Background }) => {
  const [nodes, setNodes] = useState<Array<NodeViewModel>>([
    {
      id: nanoid(),
      type: "Circle",
      fillStyle: "red",
      lineWidth: 10,
      radius: 50,
      x: 377,
      y: 289,
    },
    {
      id: nanoid(),
      type: "Polygon",
      initialPoints: [
        { x: 60, y: 120 },
        { x: 60, y: 75 },
        { x: 90, y: 75 },
        { x: 90, y: 90 },
        { x: 135, y: 90 },
        { x: 135, y: 105 },
        { x: 90, y: 105 },
        { x: 90, y: 120 },
      ]
    },
    {
      id: nanoid(),
      type: "Group",
      nestedList: [
        {
          id: nanoid(),
          type: "Polygon",
          initialPoints: [
            { x: 400, y: 400 },
            { x: 420, y: 300 },
            { x: 440, y: 350 },
            { x: 500, y: 300 },
            { x: 500, y: 400 },
          ]
        }
      ]
    }
  ])

  const mapShapes = useCallback(
    (nodes: Array<NodeViewModel>, callback: <T extends ShapeViewModel>(shape: T) => T): Array<NodeViewModel> => {
      return nodes.map((node) => {
        if (node.type === "Group") {
          return {
            ...node,
            nestedList: mapShapes(node.nestedList, callback)
          }
        }

        return callback(node)
      })
    }, [nodes])


  return {
    mapShapes,
    nodes,
  }
}

export type NodelModelReturn = ReturnType<typeof useNodesModel>
