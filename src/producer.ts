import * as amqp from "amqplib";
import {IRabbitMqConnectionFactory} from "./connectionFactory";
import * as Logger from "bunyan";
import * as Promise from "bluebird";
import {IQueueNameConfig, asQueueNameConfig} from "./common";
import {createChildLogger} from "./childLogger";

export class RabbitMqProducer {
  constructor(private logger: Logger, private connectionFactory: IRabbitMqConnectionFactory) {
    this.logger = createChildLogger(logger, "RabbitMqProducer");
  }

  publish<T>(queue: string | IQueueNameConfig, message: T): Promise<void> {
    const queueConfig = asQueueNameConfig(queue);
    const settings = this.getQueueSettings(queueConfig.dlx);
    return this.connectionFactory.create()
      .then(connection => connection.createChannel())
      .then(channel => {
        return Promise.resolve(channel.assertQueue(queueConfig.name, settings)).then(() => {
          if (!channel.sendToQueue(queueConfig.name, this.getMessageBuffer(message), { persistent: true })) {
            this.logger.error("unable to send message to queue '%j' {%j}", queueConfig, message)
            return Promise.reject(new Error("Unable to send message"))
          }

          this.logger.trace("message sent to queue '%s' (%j)", queueConfig.name, message)
        });
      });
  }

  protected getMessageBuffer<T>(message: T) {
    return new Buffer(JSON.stringify(message), 'utf8');
  }

  protected getQueueSettings(deadletterExchangeName: string): amqp.Options.AssertQueue {
    return {
      durable: true,
      autoDelete: true,
      arguments: {
        'x-dead-letter-exchange': deadletterExchangeName
      }
    }
  }
}
