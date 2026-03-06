import { MessageBus } from "./message-bus";
import { MessageHandler } from "./message-handler";

export enum MessagePriority {
  NORMAL,
  HIGH,
}

export class Message {
  public constructor(
    public code: string,
    public sender: any,
    public context?: any,
    public priority: MessagePriority = MessagePriority.NORMAL
  ) {}

  public static send(code: string, sender: any, context?: any): void {
    const message = new Message(code, sender, context, MessagePriority.NORMAL)
    
    MessageBus.post(message)
  }

  public static sendPriority(code: string, sender: any, context?: any): void {
    const message = new Message(code, sender, context, MessagePriority.HIGH) 
    
    MessageBus.post(message)
  }

  public static subscribe(code: string, handler: MessageHandler): void {
    MessageBus.addSubscription(code, handler)
  }

  public static unsubscribe(code: string, handler: MessageHandler): void {
    MessageBus.removeSubscription(code, handler)
  }
}