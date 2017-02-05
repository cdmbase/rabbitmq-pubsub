# rabbitmq-pub-sub

TypeScript NodeJs Platform

## Introduction

A typescript library for producing and consuming rabbitmq messages


If you don't have `typings` installed:
```
npm i typings -g
```

## Getting Started

### Installation
Install via `npm`
```
npm i rabbitmq-pub-sub --save
```

## Example

```typescript
import {RabbitMqConnectionFactory,RabbitMqConsumer,RabbitMqProducer,IRabbitMqConnectionConfig} from "rabbitmq-pub-sub";
import * as Logger from "bunyan"

const logger: Logger = //create logger
interface IMessage{
  data: string;
  value: number;
}

// Create connection with amqp connection string
// const factory = new RabbitMqConnectionFactory(logger, "amqp://localhost:1234");

// or, create connection with host/port config
const config:IRabbitMqConnectionConfig = {
  host:"localhost",
  port:1234
}
const factory = new RabbitMqConnectionFactory(logger, config);

const consumer = new RabbitMqConsumer(logger, factory)

consumer.subscribe<IMessage>("<queue name>", m => {
  // message received
  console.log("Message", m.data, m.value)
}).then(disposer => {
  // later, if you want to dispose the subscription
  disposer().then(() => {
    // resolved when consumer subscription disposed
  });
}).catch(err => {
  // failed to create consumer subscription!
});

const producer = new RabbitMqProducer(logger, factory)

producer.publish<IMessage>("<queue name>", {data: "data", value: 23})
  .then(() => {
    // sent to queue
  }).catch((err) => {
    // failed to enqueue
  })
```


## Consumed Libraries

### [amqplib](https://github.com/squaremo/amqp.node)
amqp library


## Inspiration
Rokot - [Rocketmakers](http://www.rocketmakers.com/) 