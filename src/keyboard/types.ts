import type { RefObject } from "react"

export type Key = KeyboardEvent["key"]
export type Callback = (event: KeyboardEvent) => void

export type WrappedCallback = { callback: Callback } | null
export type WrappedCallbackRef = RefObject<WrappedCallback>

export type Queue = WrappedCallbackRef[]