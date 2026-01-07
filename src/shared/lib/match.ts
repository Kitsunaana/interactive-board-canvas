export type AnyState<K extends PropertyKey = "type"> = {
  [P in K]: PropertyKey
}

export type MatchHandlers<State, Discriminant extends keyof State> = {
  [Key in State[Discriminant] & PropertyKey]: (state: Extract<State, { [P in Discriminant]: Key }>) => any
}

export type MatchReturn<MatchMap> = MatchMap[keyof MatchMap] extends (...args: any) => infer R ? R : never

export function match<
  State extends { type: PropertyKey },
  Map extends MatchHandlers<State, "type">
>(state: State, map: Map): MatchReturn<Map>
export function match<
  State,
  Discriminant extends keyof State,
  Map extends MatchHandlers<State, Discriminant>
>(state: State, map: Map, discriminant: Discriminant): MatchReturn<Map>
export function match(state: any, map: any, discriminant: PropertyKey = "type") {
  const key = state[discriminant]
  const handler = map[key] ?? map.__other
  return handler?.(state)
}
