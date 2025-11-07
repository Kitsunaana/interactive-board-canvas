import { useEffect, useState } from "react"
import { cameraEmitter, type CameraEvents } from "./model"

const toPercentZoom = (scale: number) => (scale * 100).toFixed(0) + "%"

export const useSubscribeToCameraZoom = () => {
  const [zoom, setZoom] = useState(toPercentZoom(1))

  useEffect(() => {
    const subsriber = (event: CameraEvents["change-zoom"]) => {
      setZoom(toPercentZoom(event.scale))
    }

    cameraEmitter.on("change-zoom", subsriber)

    return () => {
      cameraEmitter.off("change-zoom", subsriber)
    }
  })

  const onZoomIn = () => {
    cameraEmitter.emit("zoom-in")
  }

  const onZoomOut = () => {
    cameraEmitter.emit("zoom-out")
  }

  return {
    onZoomOut,
    onZoomIn,
    zoom,
  }
}