import { useEffect, useState } from "react"
import { wheelCamera$, zoomTrigger$ } from "."

export const useZoomAdapter = () => {
  const [zoom, setZoom] = useState("100%")

  useEffect(() => {
    const subscriber = wheelCamera$.subscribe((state) => setZoom(
      `${Math.trunc(state.camera.scale * 100)}%`
    ))
    
    return subscriber.unsubscribe
  }, [])

  const onZoomOut = () => {
    zoomTrigger$.next({
      __event: "zoomOut"
    })
  }

  const onZoomIn = () => {
    zoomTrigger$.next({
      __event: "zoomIn"
    })
  }

  return {
    onZoomOut,
    onZoomIn,
    zoom,
  }
}