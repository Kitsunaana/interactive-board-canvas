import { type HTMLAttributes, type PropsWithChildren, type RefCallback, useCallback, useEffect, useRef, useState } from "react";
import { Stage as StageModel } from "../core/Stage";
import { createStrictContext, useStrictContext } from "./utils";
import { ContainerContext } from "./Container"

export type StageProps = PropsWithChildren & {
  width: number
  height: number
}

export const StageContext = createStrictContext<StageModel>()

export const useStageModel = () => useStrictContext(StageContext)

export const StageNode = ({ children, width, height, ...otherProps }: StageProps & HTMLAttributes<HTMLDivElement>) => {
  const [stageModel, setStageModel] = useState<StageModel | null>(null)
  const stageModelRef = useRef<StageModel | null>(null)

  useEffect(() => {
    if (!stageModel) return

    stageModel.sizes = {
      width,
      height,
    }
  }, [stageModel, width, height]);

  const subscribeToStageContent = useCallback<RefCallback<HTMLDivElement>>(
    (node) => {
      if (node) {
        const nextStageModel = StageModel.create(node)
        stageModelRef.current = nextStageModel
        setStageModel(nextStageModel)
        return
      }

      stageModelRef.current?.destroy()
      stageModelRef.current = null
      setStageModel(null)
    },
    []
  )

  return (
    <div {...otherProps} className="stage-content" style={{ width, height }} ref={subscribeToStageContent}>
      {stageModel && (
        <ContainerContext.Provider value={stageModel}>
          <StageContext.Provider value={stageModel}>
            {children}
          </StageContext.Provider>
        </ContainerContext.Provider>
      )}
    </div>
  )
}