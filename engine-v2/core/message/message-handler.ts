import { Message } from "./message";

export interface MessageHandler {
  onMessage(message: Message): void
}