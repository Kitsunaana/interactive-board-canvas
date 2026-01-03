export type AnyState = { type: string }

export type MatchHandlers<State extends AnyState> = {
  [Key in State["type"]]?: (state: Extract<State, { type: Key }>) => any
} & {
  __other?: (state: State) => any
}

export type MatchReturn<MatchMap> = MatchMap[keyof MatchMap] extends (...args: any) => infer R ? R : never

export const match = <State extends AnyState, MatchMap extends MatchHandlers<State>>(
  state: State,
  map: MatchMap
): MatchReturn<MatchMap> => {
  const handler = map[state.type as keyof MatchMap] ?? map.__other
  return handler?.(state as any)
}
