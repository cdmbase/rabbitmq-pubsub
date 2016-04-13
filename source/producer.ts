import * as amqp from "amqplib";
import {IConnectionFactory} from "./connectionFactory";

export class Producer {
  constructor(private factory: IConnectionFactory) {
  }

  publish<T>(queueName: string, message: T): Promise<void> {
    const deadletterExchangeName = this.getDeadletterExchangeName(queueName);
    const settings = this.getQueueSettings(deadletterExchangeName);
    return this.factory.create()
      .then(connection => connection.createChannel())
      .then(channel => {
        return channel.assertQueue(queueName, settings).then(() => {
          const messageBuffer = new Buffer(JSON.stringify(message), 'utf8');
          return channel.sendToQueue(queueName, messageBuffer);
        });
      }).return();
  }

  protected getQueueSettings(deadletterExchangeName: string): amqp.Options.AssertQueue {
    return {
      durable: true,
      autoDelete: false,
      arguments: {
        'x-dead-letter-exchange': deadletterExchangeName
      }
    }
  }

  protected getDeadletterExchangeName(queueName: string){
    return `${queueName}.DLQ.Exchange`;
  }
}
