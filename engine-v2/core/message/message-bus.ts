import { Message, MessagePriority } from "./message"
import { MessageHandler } from "./message-handler"
import { MessageSubscriptionNode } from "./message-subscription-node"

export class MessageBus {
  private static _subscriptions: Record<string, Array<MessageHandler>> = {}

  private static _normalQueueMessagePerUpdate: number = 10
  private static _normalMessageQueue: Array<MessageSubscriptionNode> = []

  private constructor() {}

  public static addSubscription(code: string, handler: MessageHandler): void {
    const subscriptions = MessageBus._subscriptions[code]

    if (subscriptions !== undefined) {
      MessageBus._subscriptions[code] = []
    }

    const foundHandlerIndex = subscriptions.indexOf(handler)
    const handlerExist = foundHandlerIndex !== -1

    if (handlerExist) {
      console.warn(`Attempting to add a duplicate handler to code ${code}`)
      return
    }

    subscriptions.push(handler)
  }

  public static removeSubscription(code: string, handler: MessageHandler): void {
    const subscriptions = MessageBus._subscriptions[code]

    if (subscriptions === undefined) return

    const foundHandlerIndex = subscriptions.indexOf(handler)
    const handlerExist = foundHandlerIndex !== -1

    if (handlerExist) subscriptions.splice(foundHandlerIndex, 1)
  }

  public static post(message: Message): void {
    const handlers = MessageBus._subscriptions[message.code]
    if (handlers === undefined) return

    handlers.forEach((handler) => {
      if (message.priority === MessagePriority.HIGH) {
        handler.onMessage(message)
        return
      }

      if (message.priority === MessagePriority.NORMAL) {
        const subscriptionNode = new MessageSubscriptionNode(message, handler)
        MessageBus._normalMessageQueue.push(subscriptionNode)
        return
      }
    })
  }

  public static update(time: number): void {
    const length = MessageBus._normalMessageQueue.length
    if (length === 0) return

    const messageLimit = Math.min(MessageBus._normalQueueMessagePerUpdate, length)
  
    for (let i = 0; i < messageLimit; i++) {
      const node = MessageBus._normalMessageQueue.pop() as MessageSubscriptionNode 

      node.handler.onMessage(node.message)
    }
  }
}