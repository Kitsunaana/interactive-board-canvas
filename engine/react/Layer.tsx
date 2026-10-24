import { forwardRef, type PropsWithChildren, useEffect, useImperativeHandle, useRef, useState } from "react";
import { type AnyFunction, forEachObject } from "../utils";
import { Background } from "../world/BG";
import { ContainerContext } from "./Container";
import { CALLBACK_NAME_ALIASES, type NodeProps } from "./Node";
import { useStageModel } from "./Stage";
import { createStrictContext, useStrictContext } from "./utils";

export const LayerContext = createStrictContext<Background>()

export const useLayerModel = () => useStrictContext(LayerContext)

export const LayerNode = forwardRef<Background, PropsWithChildren<NodeProps<Background>>>(({ children, ...callbacks }, ref) => {
  const [layerModel, setLayerModel] = useState<Background | null>(null)
  const stageModel = useStageModel()

  const mainCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const hitCanvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const mainCanvas = mainCanvasRef.current
    const hitCanvas = hitCanvasRef.current
    let bg: Background | null = null

    if (mainCanvas && hitCanvas) {
      bg = Background.create(mainCanvas, hitCanvas)
      stageModel.appendChild(bg)
      setLayerModel(bg)
    }

    return () => {
      setLayerModel(null)
      bg?.destroy()
    }
  }, [stageModel])

  useEffect(() => {
    if (!layerModel) return
    
    forEachObject(callbacks, ({ key, value }) => layerModel.on(CALLBACK_NAME_ALIASES[key] ?? key, value as AnyFunction))
    return () => forEachObject(callbacks, ({ key, value }) => layerModel.off(CALLBACK_NAME_ALIASES[key] ?? key, value as AnyFunction))

  }, [layerModel, callbacks])

  useImperativeHandle(ref, () => layerModel as Background, [layerModel])

  return (
    <>
      <canvas ref={mainCanvasRef} />
      <canvas ref={hitCanvasRef} style={{ display: "none" }} />

      {layerModel && (
        <ContainerContext.Provider value={layerModel}>
          <LayerContext.Provider value={layerModel}>
            {children}
          </LayerContext.Provider>
        </ContainerContext.Provider>

      )}
    </>
  )
})
