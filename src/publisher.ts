import * as amqp from "amqplib";
import { IRabbitMqConnectionFactory } from "./connectionFactory";
import * as Logger from "bunyan";
import * as Promise from "bluebird";
import { IQueueNameConfig, asPubSubQueueNameConfig } from "./common";
import { createChildLogger } from "./childLogger";

export class RabbitMqPublisher {
    constructor(private logger: Logger, private connectionFactory: IRabbitMqConnectionFactory) {
        this.logger = createChildLogger(logger, "RabbitMqPublisher");

    }

    publish<T>(queue: string | IQueueNameConfig, message: T): Promise<void> {
        const queueConfig = asPubSubQueueNameConfig(queue);
        const settings = this.getSettings();
        return this.connectionFactory.create()
            .then(connection => connection.createChannel())
            .then(channel => {
                this.logger.trace("got channel for exchange '%s'", queueConfig.dlx);
                return this.setupChannel<T>(channel, queueConfig)
                    .then(() => {
                        return Promise.resolve(channel.publish(queueConfig.dlx, '', this.getMessageBuffer(message))).then(() => {
                            this.logger.trace("message sent to exchange '%s' (%j)", queueConfig.dlx, message)
                        });
                    }).catch(() => {
                         this.logger.error("unable to send message to exchange '%j' {%j}", queueConfig.dlx, message)
                        return Promise.reject(new Error("Unable to send message"))
                    })
            });
    }

    private setupChannel<T>(channel: amqp.Channel, queueConfig: IQueueNameConfig) {
        this.logger.trace("setup '%j'", queueConfig);
        return Promise.all(this.getChannelSetup(channel, queueConfig));
    }

    protected getMessageBuffer<T>(message: T) {
        return new Buffer(JSON.stringify(message), 'utf8');
    }

    protected getChannelSetup(channel: amqp.Channel, queueConfig: IQueueNameConfig) {
        return [
            channel.assertExchange(queueConfig.dlx, 'fanout', this.getSettings()),
        ]
    }

    protected getSettings(): amqp.Options.AssertQueue {
        return {
            durable: false,
        }
    }
}


