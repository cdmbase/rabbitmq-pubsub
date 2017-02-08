import * as sinon from "sinon";
import { RabbitMqConnectionFactory, RabbitMqConsumer, RabbitMqProducer, 
  IRabbitMqConnectionConfig, RabbitMqSingletonConnectionFactory } from "../main";
import { ConsoleLogger } from "cdm-logger";
import * as Promise from "bluebird";
import 'jest';

import { DefaultQueueNameConfig } from "../common";

const logger = ConsoleLogger.create("test", { level: "trace" });
const config: IRabbitMqConnectionConfig = { host: "127.0.0.1", port: 5672 };
const invalidConfig: IRabbitMqConnectionConfig = { host: "127.0.0.1", port: 5670 };
const queueName = "TestPC";

interface IMessage {
  data: string;
  value: number;
}

describe("RabbitMqSingletonConnectionFactory Test", () => {

  it("Singleton Connection Factory should return singleton connection", () => {
    var f = new RabbitMqSingletonConnectionFactory(logger, config);
    return Promise.all([f.create(), f.create(), f.create()]).then(cons => {
      expect(cons).toBeTruthy;
      expect(cons.length).toEqual(3);

      cons.forEach((con, i) => {
        expect(con).toBeTruthy;
        if (i > 0) {
          expect(cons[0]).toEqual(con);
        }
      })
    })
  })
})

describe("RabbitMq Test", () => {

  it("ConnectionFactory: Invalid Connection config should fail create", () => {
    var factory = new RabbitMqConnectionFactory(logger, invalidConfig);
    return factory.create().catch(v => {
      expect(v).toBeTruthy;
      expect(v.code).toBe("ECONNREFUSED");
    });
  })

  it("RabbitMqConsumer: Invalid Connection config should fail subscribe", () => {
    var factory = new RabbitMqConnectionFactory(logger, invalidConfig);
    const consumer = new RabbitMqConsumer(logger, factory)
    return consumer.subscribe(queueName, m => { }).
      catch(v => {
        expect(v).toBeTruthy;
        expect(v.code).toBe("ECONNREFUSED");
      })
  })

  it("RabbitMqProducer: Invalid Connection config should fail publish", () => {
    var factory = new RabbitMqConnectionFactory(logger, invalidConfig);
    const producer = new RabbitMqProducer(logger, factory)
    return producer.publish(queueName, {}).catch(v => {
      expect(v).toBeTruthy;
      expect(v.code).toBe("ECONNREFUSED");
    });
  })

  it("Consumer should subscribe and dispose ok with simple queue name", () => {
    const spy = sinon.spy()
    const factory = new RabbitMqConnectionFactory(logger, config);
    const consumer = new RabbitMqConsumer(logger, factory)
    return consumer.subscribe<IMessage>(queueName, spy).then(s => Promise.delay(500, s))
      .then(disposer => {
        expect(disposer).toBeTruthy;

        expect(spy.callCount).toEqual(0);

        return disposer().then( () => expect.any);
        // sub.dispose();
        // expect(sub.isDisposed(), "Subscription should be disposed after 2nd dispose call").to.be.eq(true);
      });
  });

  it("Consumer should subscribe and dispose ok with queue config", () => {
    const spy = sinon.spy()
    const factory = new RabbitMqConnectionFactory(logger, config);
    const consumer = new RabbitMqConsumer(logger, factory)
    return consumer.subscribe<IMessage>(new DefaultQueueNameConfig(queueName), spy).then(s => Promise.delay(500, s))
      .then(disposer => {
        expect(disposer).toBeTruthy;

        expect(spy.callCount).toEqual(0);

        return disposer().then( () => expect.any);
        // sub.dispose();
        // expect(sub.isDisposed(), "Subscription should be disposed after 2nd dispose call").to.be.eq(true);
      });
  });

  it("Consumer should recieve message from Producer", () => {
    const spy = sinon.spy()
    const factory = new RabbitMqConnectionFactory(logger, config);
    const consumer = new RabbitMqConsumer(logger, factory)
    return consumer.subscribe<IMessage>(queueName, spy).then(disposer => {
      const producer = new RabbitMqProducer(logger, factory)
      const msg: IMessage = { data: "time", value: new Date().getTime() };

      return producer.publish<IMessage>(queueName, msg)
        .then(() => Promise.delay(500))
        .then(() => {
          expect(spy.callCount).toEqual(1);
          expect(spy.firstCall.args).toBeTruthy;
          expect(spy.firstCall.args.length).toEqual(1);
          const consumedMsg = spy.firstCall.args[0] as IMessage;
          expect(consumedMsg.data).toBeTruthy;
          expect(consumedMsg.data).toEqual(msg.data);
          expect(consumedMsg.value).toBeTruthy;
          expect(consumedMsg.value).toEqual(msg.value);
          disposer();
        });
    })
  });

  it("Consumer should DLQ message from Producer if action fails", () => {
    const factory = new RabbitMqConnectionFactory(logger, config);
    const consumer = new RabbitMqConsumer(logger, factory)
    return consumer.subscribe<IMessage>(queueName, m => Promise.reject(new Error("Test Case Error: to fail consumer subscriber message handler")))
      .then(disposer => {
        const producer = new RabbitMqProducer(logger, factory)
        const msg: IMessage = { data: "time", value: new Date().getTime() };
        return producer.publish<IMessage>(queueName, msg)
          .then(() => Promise.delay(500))
          .then(disposer);
      })
  });
})

describe("Delete Queues After tests", () => {
  it("Delete all test queues", () => {
    var f = new RabbitMqConnectionFactory(logger, config);
    var d = new DefaultQueueNameConfig(queueName);
    return f.create().then(c => {
      return c.createChannel().then(ch => {
        return Promise.all([ch.deleteExchange(d.dlx), ch.deleteQueue(d.dlq), ch.deleteQueue(d.name)]).return()
      })
    })
  })
})


//const factory = new ConnectionFactory("amqp://localhost:1234");
