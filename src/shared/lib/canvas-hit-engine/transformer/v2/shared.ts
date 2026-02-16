type CreateDragEventsFlowParams = {
  start: (event: PointerEvent) => void
  finish: (event: PointerEvent) => void
  process: (event: PointerEvent) => void

  guard: (event: PointerEvent) => boolean
}

export const createDragEventsFlow = ({ guard, start, finish, process }: CreateDragEventsFlowParams) => {
  const subscribe = (event: PointerEvent) => {
    const move = process

    const up = (event: PointerEvent) => {
      finish(event)

      window.removeEventListener("pointermove", move)
      window.removeEventListener("pointerup", up)
    }

    if (guard(event)) {
      start(event)

      window.addEventListener("pointermove", move)
      window.addEventListener("pointerup", up)
    }
  }

  window.addEventListener("pointerdown", subscribe)

  const unsubscribe = () => window.removeEventListener("pointerdown", subscribe)

  return unsubscribe
}