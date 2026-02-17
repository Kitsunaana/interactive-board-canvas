import { getPointFromEvent } from "../../point";

export type EventName = "pointermove" | "pointerup" | "pointerdown"
export type Unsubscribe = () => void

export const events = {
  pointermove: [] as any[],
  pointerdown: [] as any[],
  pointerup: [] as any[],
};

(Object.keys(events) as Array<keyof typeof events>).forEach(((key) => {
  window.addEventListener(key, (event) => {
    const cursor = getPointFromEvent(event)

    events[key].forEach((shape) => {
      if (shape.contains(cursor.x, cursor.y))
        shape.emit(key, cursor)
    })
  })
}))

export class EventBus {
  private readonly _events: Map<EventName, Array<Function>> = new Map()

  public on(key: EventName, callback: Function): Unsubscribe {
    const callbacks = this._events.get(key)

    if (callbacks === undefined) this._events.set(key, [callback])
    else callbacks.push(callback)

    return () => {
      const current = this._events.get(key)
      if (current === undefined) return

      const index = current.indexOf(callback)
      const prev = current.slice(0, index)
      const next = current.slice(index + 1)

      this._events.set(key, prev.concat(next))
    }
  }

  public emit(key: EventName, ...args: any[]): void {
    const callbacks = this._events.get(key)
    if (callbacks === undefined) return

    callbacks.forEach(callback => callback(...args))
  }
}