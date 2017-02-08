import * as sinon from "sinon";
import {
    RabbitMqConnectionFactory, RabbitMqSubscriber, RabbitMqPublisher,
    IRabbitMqConnectionConfig, RabbitMqSingletonConnectionFactory
} from "../main";
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


describe("RabbitMQ pub sub test", () => {
    var originalTimeout;

    beforeEach(function () {
        originalTimeout = jasmine.DEFAULT_TIMEOUT_INTERVAL;
        jasmine.DEFAULT_TIMEOUT_INTERVAL = 60000;
    });
    afterEach(function () {
        jasmine.DEFAULT_TIMEOUT_INTERVAL = originalTimeout;
    });
    it("Subscriber should recieve message from Publisher", (done) => {
        const spy = sinon.spy()
        const factory = new RabbitMqConnectionFactory(logger, config);
        const consumer = new RabbitMqSubscriber(logger, factory)
        return consumer.subscribe<IMessage>(queueName, spy).then(disposer => {
            const producer = new RabbitMqPublisher(logger, factory)
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
                    done();
                });
        })
    });

    it("Subscriber should recieve message from Publisher when run seperately each", (done) => {
        const spy = sinon.spy()
        const factory = new RabbitMqConnectionFactory(logger, config);
        const consumer = new RabbitMqSubscriber(logger, factory);
        const producer = new RabbitMqPublisher(logger, factory)
        const msg: IMessage = { data: "time", value: new Date().getTime() };
        const callback = (msg) => {
            //  this.logger.debug("msg received is ", msg);
            expect(msg).toBeTruthy;
            expect(msg.data).toEqual(msg.data);
            expect(msg.value).toBeTruthy;
            expect(msg.value).toEqual(msg.value);
        }

        consumer.subscribe<IMessage>(queueName, callback).then(disposer => {
            Promise.delay(1500)
                .then(() => {
                    disposer();
                    done();
                });
        })
        return Promise.delay(50).then(() => producer.publish<IMessage>(queueName, msg));
    });


    it("Multiple Subscriber should recieve message from Publisher", (done) => {

        const factory = new RabbitMqConnectionFactory(logger, config);
        const subscriber1 = new RabbitMqSubscriber(logger, factory);
        const subscriber2 = new RabbitMqSubscriber(logger, factory);
        const subscriber3 = new RabbitMqSubscriber(logger, factory);
        const subscriber4 = new RabbitMqSubscriber(logger, factory);
        const subscriber5 = new RabbitMqSubscriber(logger, factory);
        const subscriber6 = new RabbitMqSubscriber(logger, factory);

        const publisher = new RabbitMqPublisher(logger, factory);
        const msg: IMessage = { data: "time", value: new Date().getTime() };
        const callback = (msg) => {
            //  this.logger.debug("msg received is ", msg);
            expect(msg).toBeTruthy;
            expect(msg.data).toEqual(msg.data);
            expect(msg.value).toBeTruthy;
            expect(msg.value).toEqual(msg.value);
        }

        subscriber1.subscribe<IMessage>(queueName, callback).then(disposer => {
            Promise.delay(2000)
                .then(() => {
                    disposer();
                    done();
                })

        })
        subscriber2.subscribe<IMessage>(queueName, callback).then(disposer => {
            Promise.delay(2000)
                .then(() => {
                    disposer();
                    done();
                });
        })
        subscriber3.subscribe<IMessage>(queueName, callback).then(disposer => {
            Promise.delay(2000)
                .then(() => {
                    disposer();
                    done();
                });
        })
        subscriber4.subscribe<IMessage>(queueName, callback).then(disposer => {
            Promise.delay(2000)
                .then(() => {
                    disposer();
                    done();
                });
        })
        subscriber5.subscribe<IMessage>(queueName, callback).then(disposer => {
            Promise.delay(2000)
                .then(() => {
                    disposer();
                    done();
                });
        })
        subscriber6.subscribe<IMessage>(queueName, callback).then(disposer => {
            Promise.delay(2000)
                .then(() => {
                    disposer();
                    done();
                });
        })
        Promise.delay(500).then(() => publisher.publish<IMessage>(queueName, msg))
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
