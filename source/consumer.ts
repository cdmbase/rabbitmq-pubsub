import * as amqp from "amqplib";
import {IConnectionFactory} from "./connectionFactory";

export class Consumer {
  constructor(private factory: IConnectionFactory) {
  }

  subscribe<T>(queueName: string, action: (message: T) => Promise<any>|void): Promise<void> {
    const deadletterQueueName = this.getDeadletterQueueName(queueName);
    const deadletterExchangeName = this.getDeadletterExchangeName(queueName);
    return this.factory.create()
      .then(connection => connection.createChannel())
      .then(channel => {
      console.log("got channel");
      return Promise.all(this.getChannelSetup(channel, queueName, deadletterQueueName, deadletterExchangeName)).then(() => {
        console.log("set up queues");
        return channel.consume(queueName, (message) => {
          Promise.try(() => action(this.getMessageObject<T>(message)))
            .then(() => channel.ack(message))
            .catch((err) => {
              console.error(err);
              console.error(err.stack); // TODO: use bunyan for logging
              channel.nack(message, false, false);
            });
        });
      });
    }).return();
  }

  protected getMessageObject<T>(message: amqp.Message){
    return JSON.parse(message.content.toString('utf8')) as T;
  }

  protected getChannelSetup(channel: amqp.Channel, queueName: string, deadletterQueueName: string, deadletterExchangeName: string){
    return [
      channel.assertQueue(queueName, this.getQueueSettings(deadletterExchangeName)),
      channel.assertQueue(deadletterQueueName, this.getDLSettings()),
      channel.assertExchange(deadletterExchangeName, 'fanout', this.getDLSettings()),
      channel.bindQueue(deadletterQueueName, deadletterExchangeName, '*')
    ]
  }
  protected getDeadletterQueueName(queueName: string){
    return `${queueName}.DLQ`;
  }

  protected getDeadletterExchangeName(queueName: string){
    return `${this.getDeadletterQueueName(queueName)}.Exchange`;
  }

  protected getQueueSettings(deadletterExchangeName: string): amqp.Options.AssertQueue {
    var settings = this.getDLSettings();
    settings.arguments = {
      'x-dead-letter-exchange': deadletterExchangeName
    }
    return settings;
  }

  protected getDLSettings(): amqp.Options.AssertQueue {
    return {
      durable: true,
      autoDelete: false
    }
  }
}
