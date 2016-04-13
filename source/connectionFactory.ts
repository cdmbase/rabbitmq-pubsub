import * as amqp from "amqplib";

export interface IConnectionFactory {
  create(): Promise<amqp.Connection>;
}

export interface IConnectionConfig {
  host: string;
  port: number;
}

export class ConnectionFactory implements IConnectionFactory {
  private connection: string;
  constructor(config: IConnectionConfig | string){
    this.connection = ConnectionFactory.isConfig(config) ? `amqp://${config.host}:${config.port}` : config;
  }
  
  private static isConfig(config: IConnectionConfig | string) : config is IConnectionConfig{
    if ((config as IConnectionConfig).host && (config as IConnectionConfig).port) {
      return true;
    }
  }

  create(): Promise<amqp.Connection> {
    return Promise.resolve(amqp.connect(this.connection));
  }
}
