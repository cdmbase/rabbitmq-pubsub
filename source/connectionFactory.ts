import * as amqp from "amqplib";
import {Logger} from "bunyan";
import * as Promise from "bluebird";

export interface IRabbitMqConnectionFactory {
  create(): Promise<amqp.Connection>;
}

export interface IRabbitMqConnectionConfig {
  host: string;
  port: number;
}

function isConnectionConfig(config: IRabbitMqConnectionConfig | string) : config is IRabbitMqConnectionConfig{
  if ((config as IRabbitMqConnectionConfig).host && (config as IRabbitMqConnectionConfig).port) {
    return true;
  }
}

export class RabbitMqConnectionFactory implements IRabbitMqConnectionFactory {
  private connection: string;
  constructor(private logger:Logger, config: IRabbitMqConnectionConfig | string){
    this.connection = isConnectionConfig(config) ? `amqp://${config.host}:${config.port}` : config;
  }

  create(): Promise<amqp.Connection> {
    this.logger.info("Rabbit Connection Factory: connecting to %s", this.connection);
    return Promise.resolve(amqp.connect(this.connection)).catch(err => {
      this.logger.error("Rabbit Connection Factory: failed to create connection '%s'", this.connection);
      return Promise.reject(err);
    });
  }
}

export class RabbitMqSingletonConnectionFactory implements IRabbitMqConnectionFactory {
  private connection: string;
  private promise: Promise<amqp.Connection>;
  constructor(private logger:Logger, config: IRabbitMqConnectionConfig | string){
    this.connection = isConnectionConfig(config) ? `amqp://${config.host}:${config.port}` : config;
  }

  create(): Promise<amqp.Connection> {
    if (this.promise) {
      this.logger.trace("Rabbit Connection Factory: reusing connection to %s", this.connection);
      return this.promise;
    }
    this.logger.info("Rabbit Connection Factory: creating connection to %s", this.connection);
    return this.promise = Promise.resolve(amqp.connect(this.connection));
  }
}
