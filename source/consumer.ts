import * as amqp from "amqplib";
import {IRabbitMqConnectionFactory} from "./connectionFactory";
import {Logger} from "bunyan";
import * as Promise from "bluebird";
import {IQueueNameConfig,asQueueNameConfig} from "./common";

export interface IRabbitMqConsumerDisposer {
  (): Promise<void>;
}

export class RabbitMqConsumer {
  constructor(private logger:Logger, private connectionFactory: IRabbitMqConnectionFactory) {
  }

  subscribe<T>(queue: string | IQueueNameConfig, action: (message: T) => Promise<any>|void): Promise<IRabbitMqConsumerDisposer> {
    const queueConfig = asQueueNameConfig(queue);
    return this.connectionFactory.create()
      .then(connection => connection.createChannel())
      .then(channel => {
        this.logger.info("Rabbit Consumer: got channel for queue '%s'", queueConfig.name);
        return this.setupChannel<T>(channel, queueConfig)
          .then(() => this.subscribeToChannel<T>(channel, queueConfig, action))
      });
  }

  private setupChannel<T>(channel: amqp.Channel, queueConfig: IQueueNameConfig){
    this.logger.info("Rabbit Consumer: setup '%j'", queueConfig);
    return Promise.all(this.getChannelSetup(channel, queueConfig));
  }

  private subscribeToChannel<T>(channel: amqp.Channel, queueConfig: IQueueNameConfig, action: (message: T) => Promise<any>|void){
    this.logger.info("Rabbit Consumer: subscribing to queue '%s'", queueConfig.name);
    return channel.consume(queueConfig.name, (message) => {
        let msg: T;
        Promise.try(() => {
          msg = this.getMessageObject<T>(message);
          this.logger.trace("Rabbit Consumer: message arrived from queue '%s' (%j)", queueConfig.name, msg)
          return action(msg);
        }).then(() => {
          this.logger.trace("Rabbit Consumer: message processed from queue '%s' (%j)", queueConfig.name, msg)
          channel.ack(message)
        }).catch((err) => {
          this.logger.error(err, "Rabbit Consumer: message processing failed from queue '%j' (%j)", queueConfig, msg);
          channel.nack(message, false, false);
        });
    }).then(opts => {
      this.logger.info("Rabbit Consumer: subscribed to queue '%s' (%s)", queueConfig.name, opts.consumerTag)
      return (() => {
        this.logger.info("Rabbit Consumer: disposing subscriber to queue '%s' (%s)", queueConfig.name, opts.consumerTag)
        return Promise.resolve(channel.cancel(opts.consumerTag)).return();
      }) as IRabbitMqConsumerDisposer
    });
  }

  protected getMessageObject<T>(message: amqp.Message){
    return JSON.parse(message.content.toString('utf8')) as T;
  }

  protected getChannelSetup(channel: amqp.Channel, queueConfig: IQueueNameConfig){
    return [
      channel.assertQueue(queueConfig.name, this.getQueueSettings(queueConfig.dlx)),
      channel.assertQueue(queueConfig.dlq, this.getDLSettings()),
      channel.assertExchange(queueConfig.dlx, 'fanout', this.getDLSettings()),
      channel.bindQueue(queueConfig.dlq, queueConfig.dlx, '*')
    ]
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
