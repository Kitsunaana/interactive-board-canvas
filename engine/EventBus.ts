export type EventType<Type extends string = string, Value = unknown> = {
  type: Type
  payload: Value
}

export type EventCreator<Type extends string = string, Value = any> = {
  (value: Value): EventType<Type, Value>
  type: Type,
  withParams: <Value2>() => EventCreator<Type, Value2>
  check: (eventType: EventType) => eventType is EventType<Type, Value>
}

export type Listener<Type extends string = string, Value = unknown> = (arg: EventType<Type, Value>) => void

export const createRoute = <Type extends string, Value = void>(key: Type): EventCreator<Type, Value> => {
  const creator = (value: Value) => ({
    type: key,
    payload: value,
  })

  creator.type = key

  creator.withParams = <Value2>() => creator as unknown as EventCreator<Type, Value2>
  creator.check = (eventType: EventType): eventType is EventType<Type, Value> => eventType.type === key

  return creator
}

export class EventEmitter {
  protected _listeners = new Map<string, Set<Listener>>()

  public on<Type extends string, Value>(
    eventCreator: EventCreator<Type, Value>,
    callback: Listener<Type, Value>,
  ) {
    if (!this._listeners.has(eventCreator.type)) {
      this._listeners.set(eventCreator.type, new Set())
    }

    this._listeners.get(eventCreator.type)!.add(callback as Listener)
  }

  public emit<Type extends string, Value>(event: EventType<Type, Value>) {
    if (this._listeners.has(event.type)) {
      this._listeners.get(event.type)!.forEach((callback) => callback(event))
    }
  }

  public off<K extends string, V>(eventCreator: EventCreator<K, V>, callback: Listener<K, V>) {
    if (this._listeners.has(eventCreator.type)) {
      this._listeners.get(eventCreator.type)!.delete(callback as Listener)
    }
  }
}