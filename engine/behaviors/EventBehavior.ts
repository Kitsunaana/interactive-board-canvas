import type { SimObject } from "../world/sim-object"

type EventHandler<EventPayload = EventObject<any>> = (event: EventPayload) => void

type ListenerEntry = {
  callback: EventHandler<any>
  namespace?: string
  once: boolean
}

type ParsedEventToken = {
  eventType?: string
  namespace?: string
}

export interface EventObject<EventType = Event> {
  type: string
  target: SimObject
  currentTarget: SimObject
  evt: EventType
  cancelBubble: boolean
  child?: SimObject
  [key: string]: unknown
  stopPropagation(): void
}

const parseEventToken = (token: string): ParsedEventToken => {
  const normalized = token.trim()
  if (!normalized) return {}

  const separatorIndex = normalized.indexOf(".")
  if (separatorIndex === -1) {
    return {
      eventType: normalized
    }
  }

  const eventType = normalized.slice(0, separatorIndex) || undefined
  const namespace = normalized.slice(separatorIndex + 1) || undefined

  return {
    eventType,
    namespace,
  }
}

const toEventTokens = (eventNames?: string): ParsedEventToken[] => {
  if (!eventNames) return []

  return eventNames
    .split(/\s+/)
    .map(parseEventToken)
    .filter((token) => token.eventType || token.namespace)
}

export abstract class EventBehavior {
  public abstract parent(): SimObject | null

  private readonly _listenersMap: Map<string, Array<ListenerEntry>> = new Map()

  public on<EventPayload = EventObject>(eventNames: string, callback: EventHandler<EventPayload>): this {
    return this._addListeners(eventNames, callback as EventHandler, false)
  }

  public once<EventPayload = EventObject>(eventNames: string, callback: EventHandler<EventPayload>): this {
    return this._addListeners(eventNames, callback as EventHandler, true)
  }

  public off(eventNames?: string, callback?: EventHandler<any>): this {
    if (!eventNames) {
      if (callback) {
        this._listenersMap.forEach((entries, eventType) => {
          const filtered = entries.filter((entry) => entry.callback !== callback)
          
          if (filtered.length === 0) this._listenersMap.delete(eventType)
          else this._listenersMap.set(eventType, filtered)
        })
      } else {
        this._listenersMap.clear()
      }

      return this
    }

    const tokens = toEventTokens(eventNames)

    tokens.forEach(({ eventType, namespace }) => {
      if (!eventType) {
        this._listenersMap.forEach((entries, key) => {
          const filtered = entries.filter((entry) => {
            if (namespace && entry.namespace !== namespace) return true
            if (callback && entry.callback !== callback) return true
            return false
          })

          if (filtered.length === 0) this._listenersMap.delete(key)
          else this._listenersMap.set(key, filtered)
        })

        return
      }

      const entries = this._listenersMap.get(eventType)
      if (!entries) return

      const filtered = entries.filter((entry) => {
        if (namespace && entry.namespace !== namespace) return true
        if (callback && entry.callback !== callback) return true
        return false
      })

      if (filtered.length === 0) this._listenersMap.delete(eventType)
      else this._listenersMap.set(eventType, filtered)
    })

    return this
  }

  public fire<EventType = Event>(
    eventName: string,
    event?: Partial<EventObject<EventType>> & Record<string, unknown>,
    bubble = false
  ): this {
    const { eventType, namespace } = parseEventToken(eventName)
    if (!eventType) return this

    const evt = this._normalizeEvent<EventType>(eventType, event)

    this._fire(eventType, namespace, evt)

    if (bubble && !evt.cancelBubble) {
      this.parent()?.fire(eventType, evt, true)
    }

    return this
  }

  private _addListeners(eventNames: string, callback: EventHandler<any>, once: boolean): this {
    toEventTokens(eventNames).forEach(({ eventType, namespace }) => {
      if (!eventType) return

      const listeners = this._listenersMap.get(eventType)

      if (listeners) listeners.push({ callback, namespace, once })
      else this._listenersMap.set(eventType, [{ callback, namespace, once }])
    })

    return this
  }

  private _normalizeEvent<EventType = Event>(
    eventType: string,
    event?: Partial<EventObject<EventType>> & Record<string, unknown>
  ): EventObject<EventType> {
    const evt = (event?.evt ?? event) as EventType
    const target = (event?.target as SimObject | undefined) ?? this as unknown as SimObject
    const currentTarget = (event?.currentTarget as SimObject | undefined) ?? this as unknown as SimObject

    const normalizedEvent: EventObject<EventType> = {
      ...(event ?? {}),
      type: eventType,
      target,
      currentTarget,
      evt,
      cancelBubble: Boolean(event?.cancelBubble),
      stopPropagation() {
        normalizedEvent.cancelBubble = true
      },
    }

    return normalizedEvent
  }

  private _fire<EventType = Event>(
    eventType: string,
    namespace: undefined | string,
    event: EventObject<EventType>
  ): void {
    const listeners = this._listenersMap.get(eventType)
    if (!listeners || listeners.length === 0) {
      return
    }

    event.currentTarget = this as unknown as SimObject

    const listenersSnapshot = listeners.slice()

    listenersSnapshot.forEach((entry) => {
      if (
        (entry.namespace === undefined && namespace === undefined) ||
        (entry.namespace && namespace && entry.namespace === namespace)
      ) {
        entry.callback(event)

        if (entry.once) {
          this.off(`${entry.namespace}.${eventType}`, entry.callback)
        }
      }

    })
  }
}
