const { Kafka, logLevel } = require('kafkajs');

const DEAD_LETTER_SUFFIX = '.dead-letter';

/**
 * Thin wrapper around kafkajs shared by every services/* component, so topic
 * naming, dead-letter routing, and connection config live in one place.
 */
class EventClient {
  constructor({ clientId, brokers = (process.env.KAFKA_BROKERS || 'localhost:9092').split(',') }) {
    this.kafka = new Kafka({ clientId, brokers, logLevel: logLevel.WARN });
    this.producer = this.kafka.producer();
    this._connected = false;
  }

  async connect() {
    if (!this._connected) {
      await this.producer.connect();
      this._connected = true;
    }
  }

  async disconnect() {
    if (this._connected) {
      await this.producer.disconnect();
      this._connected = false;
    }
  }

  /** Publishes a validated event payload to a topic, keyed by correlationId for ordering within a disruption. */
  async publish(topic, payload) {
    await this.connect();
    await this.producer.send({
      topic,
      messages: [{ key: payload.correlationId, value: JSON.stringify(payload) }],
    });
  }

  /** Routes a message that failed schema validation to <topic>.dead-letter instead of dropping it. */
  async publishToDeadLetter(topic, rawMessage, error) {
    await this.connect();
    await this.producer.send({
      topic: `${topic}${DEAD_LETTER_SUFFIX}`,
      messages: [
        {
          value: JSON.stringify({
            originalTopic: topic,
            error: error.message,
            validationErrors: error.validationErrors || null,
            raw: rawMessage,
          }),
        },
      ],
    });
  }

  /** Subscribes to one or more topics and invokes handler(payload, rawMessage) per message. */
  async consume({ groupId, topics, handler }) {
    const consumer = this.kafka.consumer({ groupId });
    await consumer.connect();
    await consumer.subscribe({ topics, fromBeginning: false });
    await consumer.run({
      eachMessage: async ({ topic, message }) => {
        const raw = message.value.toString();
        let payload;
        try {
          payload = JSON.parse(raw);
        } catch (err) {
          await this.publishToDeadLetter(topic, raw, err);
          return;
        }
        await handler(payload, { topic });
      },
    });
    return consumer;
  }
}

module.exports = { EventClient };
