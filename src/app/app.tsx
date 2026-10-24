import {
  useState
} from "react";
import { CircleNode, LayerNode, StageNode, type CircleProps } from "../../engine";
import { type Sizes } from "../../engine/core/Stage.ts";
import type { GroupNodeProps } from "../../engine/react/Group.tsx";
import { GroupNode } from "../../engine/react/Group.tsx";
import { PolygonNode, type PolygonProps } from "../../engine/react/Polygon.tsx";
import "./index.css";
import type { GroupViewModel, NodeViewModel } from "./states/interface.ts";
import { useViewModel } from "./states/use-view-model.ts";
import { useResizeTransformService } from "./use-resize-transform-service.ts";


export const RenderNodeViewModel = (node: NodeViewModel) => {
  return ({
    Polygon: () => <PolygonNode {...node as PolygonProps} />,
    Circle: () => <CircleNode {...node as CircleProps} />,
    Group: () => <TreeGroup {...node as GroupViewModel} />
  })[node.type]()
}

export const TreeGroup = ({ children, nestedList, ...otherProps }: GroupNodeProps & { nestedList: Array<NodeViewModel> }) => {
  return (
    <GroupNode {...otherProps}>
      {nestedList.map((node) => <RenderNodeViewModel key={node.id} {...node} />)}
    </GroupNode>
  )
}

export const App = () => {
  const [stageSize] = useState<Sizes>({ width: window.innerWidth, height: window.innerHeight })

  const resizeService = useResizeTransformService()
  const viewModel = useViewModel(resizeService)

  return (
    <StageNode {...stageSize} {...viewModel.stage}>
      <LayerNode {...viewModel.layer} ref={viewModel.rootLayerRef}>

        {viewModel.nodes.map((node) => <RenderNodeViewModel key={node.id} {...node} />)}

        <GroupNode ref={resizeService.groupNodeRef}>
          {resizeService.isShowTransformer && (

            viewModel.resizer.handlers.map((node) => <RenderNodeViewModel {...node} />)
          )}
        </GroupNode>
      </LayerNode>
    </StageNode>
  )
}

