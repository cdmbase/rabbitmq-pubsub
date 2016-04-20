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
typings install amqplib bluebird bunyan node -SA
```

## Example

```typescript
import {RabbitMqConnectionFactory,RabbitMqConsumer,RabbitMqProducer,IRabbitMqConnectionConfig} from "rokot-mq-rabbit";
import {Logger} from "bunyan"

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
