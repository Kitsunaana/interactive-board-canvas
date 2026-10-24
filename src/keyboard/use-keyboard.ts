import { useEffect, useMemo, useRef } from "react"
import { addCallback } from "./core"
import type { Callback, Key, WrappedCallback } from "./types"

type UseKeyboardProps = {
  key: Key
  callback: Callback
  disabled?: boolean
}

export const useKeyboard = (props: UseKeyboardProps) => {
  const { key, callback, disabled = false } = props

  const wrappedCallback = useRef<WrappedCallback>(null)
  wrappedCallback.current = { callback }

  const removeCallback = useMemo(() => {
    if (disabled) return null

    return addCallback({
      key,
      wrappedCallback,
    })
  }, [key, disabled])

  useEffect(() => {
    if (removeCallback) return removeCallback
    return undefined
  }, [removeCallback])
}