import { isNull } from "lodash"
import { nanoid } from "nanoid"
import { Mixin } from "ts-mixer"
import * as Primitive from "./maths"
import { addPoint, multiplePoint } from "./shared/point"

export interface NodeConfig {
  isDraggable?: boolean
  scaleX?: number
  scaleY?: number
  name?: string
  x?: number
  y?: number
}

export const fillConfigDefaultValues = (config: NodeConfig) => ({
  isDraggable: true,
  name: undefined,
  scaleX: 1,
  scaleY: 1,
  x: 0,
  y: 0,

  ...config,
})

type EventHandler<EventPayload = KonvaEventObject<any>> = (event: EventPayload) => void

type ListenerEntry = {
  callback: EventHandler<any>
  namespace?: string
  once: boolean
}

type ParsedEventToken = {
  eventType?: string
  namespace?: string
}

export interface KonvaEventObject<EventType = Event> {
  type: string
  target: Node
  currentTarget: Node
  evt: EventType
  cancelBubble: boolean
  child?: Node
  [key: string]: unknown
  stopPropagation(): void
}

const parseEventToken = (token: string): ParsedEventToken => {
  const normalized = token.trim()

  if (!normalized) {
    return {}
  }

  const separatorIndex = normalized.indexOf(".")
  if (separatorIndex === -1) {
    return { eventType: normalized }
  }

  const eventType = normalized.slice(0, separatorIndex) || undefined
  const namespace = normalized.slice(separatorIndex + 1) || undefined

  return { eventType, namespace }
}

const toEventTokens = (eventNames?: string): ParsedEventToken[] => {
  if (!eventNames) {
    return []
  }

  return eventNames
    .split(/\s+/)
    .map(parseEventToken)
    .filter((token) => token.eventType || token.namespace)
}

export abstract class Node extends Primitive.Polygon {
  public abstract draw(context: CanvasRenderingContext2D): void
  public abstract drawHit(context: CanvasRenderingContext2D): void
  public abstract getClientRect(): Primitive.Rectangle
  public abstract getPoints(): Array<Primitive.PointData>

  private readonly _id = nanoid()

  protected readonly abstract _type: string
  protected _name: string | undefined = undefined

  private _parent: Node | null = null

  public get id(): string {
    return this._id
  }

  public constructor(params: NodeConfig) {
    super([])

    const config = fillConfigDefaultValues(params)
    this._name = config.name
  }

  public getType(): string {
    return this._type
  }

  public getName() {
    return this._name
  }

  public setParent(node: Node) {
    this._parent = node
  }

  public getParent() {
    return this._parent
  }

  public getAllParents<T extends Node>(list: Array<T> = []): Array<T> {
    const parent = this.getParent() as unknown as T

    return isNull(parent)
      ? list
      : this.getAllParents.call(parent, list.concat(parent)) as Array<T>
  }

  public findAncestor<T extends Node>(predicate: (node: Node) => boolean): T | null {
    let current = this.getParent()

    while (current) {
      if (predicate(current)) return current as T
      current = current.getParent()
    }

    return null
  }

  private readonly _listenersMap: Map<string, Array<ListenerEntry>> = new Map()

  public on<EventPayload = KonvaEventObject>(eventNames: string, callback: EventHandler<EventPayload>): this {
    return this._addListeners(eventNames, callback as EventHandler, false)
  }

  public once<EventPayload = KonvaEventObject>(eventNames: string, callback: EventHandler<EventPayload>): this {
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
      if (!entries) {
        return
      }

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
    event?: Partial<KonvaEventObject<EventType>> & Record<string, unknown>,
    bubble = false
  ): this {
    const { eventType } = parseEventToken(eventName)
    if (!eventType) {
      return this
    }

    const evt = this._normalizeEvent<EventType>(eventType, event)

    this._fire(eventType, evt)

    if (bubble && !evt.cancelBubble) {
      this.getParent()?.fire(eventType, evt, true)
    }

    return this
  }

  private _addListeners(eventNames: string, callback: EventHandler<any>, once: boolean): this {
    toEventTokens(eventNames).forEach(({ eventType, namespace }) => {
      if (!eventType) {
        return
      }

      const listeners = this._listenersMap.get(eventType)

      if (listeners) listeners.push({ callback, namespace, once })
      else this._listenersMap.set(eventType, [{ callback, namespace, once }])
    })

    return this
  }

  private _normalizeEvent<EventType = Event>(
    eventType: string,
    event?: Partial<KonvaEventObject<EventType>> & Record<string, unknown>
  ): KonvaEventObject<EventType> {
    const evt = (event?.evt ?? event) as EventType
    const target = (event?.target as Node | undefined) ?? this
    const currentTarget = (event?.currentTarget as Node | undefined) ?? this

    const normalizedEvent: KonvaEventObject<EventType> = {
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

  private _fire<EventType = Event>(eventType: string, event: KonvaEventObject<EventType>): void {
    const listeners = this._listenersMap.get(eventType)
    if (!listeners || listeners.length === 0) {
      return
    }

    event.currentTarget = this

    const listenersSnapshot = listeners.slice()

    listenersSnapshot.forEach((entry) => {
      entry.callback(event)

      if (entry.once) {
        this.off(
          entry.namespace ? `${eventType}.${entry.namespace}` : eventType,
          entry.callback
        )
      }
    })
  }
}
