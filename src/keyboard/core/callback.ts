import type { Key, Queue, WrappedCallbackRef } from "../types"
import { addEventListener, removeEventListener } from "./event"
import { allQueuesAreEmpty, getOrCreateQueue } from "./queue"

type RemoveParams = {
  queue: Queue
  wrappedCallback: WrappedCallbackRef
}

const removeCallback = ({ wrappedCallback, queue }: RemoveParams) => {
  const index = queue.findIndex((queueCallback) => queueCallback === wrappedCallback)

  if (index > -1) queue.splice(index, 1)

  if (allQueuesAreEmpty()) {
    removeEventListener()
  }
}

type AddParams = {
  key: Key
  wrappedCallback: WrappedCallbackRef
}

export const addCallback = ({ wrappedCallback, key }: AddParams) => {
  const needAddEventListener = allQueuesAreEmpty()

  const queue = getOrCreateQueue(key)
  queue.push(wrappedCallback)

  if (needAddEventListener) addEventListener()

  return () => removeCallback({ queue, wrappedCallback })
}