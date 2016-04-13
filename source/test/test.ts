// import {expect,sinon,supertest} from "../index";
//
// describe("Every Application should have a Test suite", () => {
//   it("should cover all functional areas of your code base", () => {
//     var testers = {};
//     var developers = testers;
//
//     expect(developers).to.be.eq(testers);
//   });
// })

import {ConnectionFactory,RabbitMqConsumer,RabbitMqProducer} from "../index";

interface IMessage{
  data: string;
  value: number;
}
//const factory = new ConnectionFactory("amqp://localhost:1234");
const factory = new ConnectionFactory({host:"localhost", port:1234});
const producer = new RabbitMqProducer(factory)
producer.publish<IMessage>("<queue name>", {data: "data", value: 23})

const consumer = new RabbitMqConsumer(factory)
consumer.subscribe<IMessage>("<queue name>", m => {
  console.log(m.data)
  console.log(m.value)
})
