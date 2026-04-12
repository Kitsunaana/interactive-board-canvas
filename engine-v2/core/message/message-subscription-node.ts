import { Message } from "./message";
import type { MessageHandler } from "./message-handler";

export class MessageSubscriptionNode {
  public constructor(
    public message: Message,
    public handler: MessageHandler
  ) {}
}