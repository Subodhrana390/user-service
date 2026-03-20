import { Admin,SASLOptions, Consumer, Kafka, Producer } from "kafkajs";
import { v4 as uuidv4 } from "uuid";
import { config } from "../../config/index.js";

const sasl: SASLOptions = {
  mechanism: config.kafka.sasl.mechanism,
  username: config.kafka.sasl.username,
  password: config.kafka.sasl.password,
};


const kafka = new Kafka({
  clientId: config.kafka.clientId,
  brokers: [config.kafka.brokers],
  retry: {
    initialRetryTime: config.kafka.retryDelay,
    retries: config.kafka.retries,
  },
  sasl,
  ssl: config.kafka.ssl,
  connectionTimeout: config.kafka.connectionTimeout,
  requestTimeout: config.kafka.requestTimeout,
});

let producer: Producer | null = null;
let consumer: Consumer | null = null;
let admin: Admin | null = null;

export interface IKafkaEvent<T = any> {
  id: string;
  type: string;
  timestamp: string;
  service: string;
  version: string;
  data: T;
  metadata: {
    userId?: string;
    [key: string]: any;
  };
}

export const KafkaManager = {
  async getProducer(): Promise<Producer> {
    if (!producer) {
      producer = kafka.producer({ allowAutoTopicCreation: true });
      await producer.connect();
      console.log("📤 Kafka Producer connected");
    }
    return producer;
  },

  async getConsumer(groupId?: string): Promise<Consumer> {
    if (!consumer) {
      consumer = kafka.consumer({
        groupId: groupId || config.kafka.groupId,
        sessionTimeout: 30000,
        heartbeatInterval: 3000,
        rebalanceTimeout: 60000,
      });
      await consumer.connect();
      console.log("📥 Kafka Consumer connected");
    }
    return consumer;
  },

  async publish<T = any>({
    topic,
    eventType,
    payload,
    metadata = {},
    schema,
  }: {
    topic: string;
    eventType: string;
    payload: T;
    metadata?: any;
    schema?: any;
  }): Promise<IKafkaEvent<T>> {
    const producer = await this.getProducer();

    const event: IKafkaEvent = {
      id: uuidv4(),
      type: eventType,
      timestamp: new Date().toISOString(),
      service: config.kafka.clientId,
      version: "1.0",
      data: payload,
      metadata: {
        ...metadata,
        userId: metadata.userId,
      },
    };

    if (schema) schema.parse(event);

    await producer.send({
      topic,
      messages: [
        {
          key: event.metadata.userId || event.id,
          value: JSON.stringify(event),
          headers: {
            "event-type": event.type,
            service: event.service,
          },
        },
      ],
    });

    console.log(`✅ Event published → ${event.type}`);
    return event;
  },

  async subscribe({
    topic,
    groupId,
    handler,
  }: {
    topic: string;
    groupId?: string;
    handler: (event: IKafkaEvent, context: any) => Promise<void>;
  }): Promise<void> {
    const consumer = await this.getConsumer(groupId);

    await consumer.subscribe({ topic, fromBeginning: false });

    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        try {
          if (!message.value) return;
          const event: IKafkaEvent = JSON.parse(message.value.toString());
          const currentService = process.env.KAFKA_CLIENT_ID || "user-service";

          if (event.service === currentService) return;

          await handler(event, {
            topic,
            partition,
            offset: message.offset,
            headers: message.headers,
          });
        } catch (err) {
          console.error("❌ Kafka message processing error:", err);
        }
      },
    });

    console.log(`📥 Subscribed → ${topic}`);
  },

  async shutdown(): Promise<void> {
    try {
      if (producer) await producer.disconnect();
      if (consumer) await consumer.disconnect();
      if (admin) await (admin as any).disconnect();

      console.log("🛑 Kafka connections closed");
    } catch (err) {
      console.error("❌ Kafka shutdown error:", err);
    }
  },
};
