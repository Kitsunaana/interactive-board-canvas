import { Message } from "./message";
import { MessageHandler } from "./message-handler";

export class MessageSubscriptionNode {
  public constructor(
    public message: Message,
    public handler: MessageHandler
  ) {}
}