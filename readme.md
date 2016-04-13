# rokot-mq-rabbit

Rokot - [Rocketmakers](http://www.rocketmakers.com/) TypeScript NodeJs Platform

## Introduction

A typescript library for producing and consuming rabbitmq messages


>The Rokot platform components heavily rely on usage of the [typings](https://github.com/typings/typings) utility for typescript definitions management.
If you don't have `typings` installed:
```
npm i typings -g
```

## Getting Started

### Installation
Install via `npm`
```
npm i rokot-mq-rabbit --save
```


### Typings

You will also need these ambient dependencies:
>NOTE: you might already have some of these ambient dependencies installed!

```
typings install amqplib bluebird node -DA
```

## Example

```typescript
import {ConnectionFactory,RabbitMqConsumer,RabbitMqProducer,IConnectionConfig} from "rokot-mq-rabbit";

interface IMessage{
  data: string;
  value: number;
}

// Create connection with amqp connection string
// const factory = new ConnectionFactory("amqp://localhost:1234");

// or, create connection with host/port config
const config:IConnectionConfig = {
  host:"localhost",
  port:1234
}
const factory = new ConnectionFactory(config);

const consumer = new RabbitMqConsumer(factory)
consumer.subscribe<IMessage>("<queue name>", m => {
  console.log(m.data)
  console.log(m.value)
})

const producer = new RabbitMqProducer(factory)
producer.publish<IMessage>("<queue name>", {data: "data", value: 23})
```


## Consumed Libraries

### [amqplib](https://github.com/squaremo/amqp.node)
amqp library
