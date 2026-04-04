import { config } from "../config/index.js";
import { EVENT_TYPES } from "../infra/kafka/eventTypes.js";
import { IKafkaEvent, KafkaManager } from "../infra/kafka/kafkaClient.js";
import UserProfile from "../models/user-profile.model.js";

export const handleShopEvents = async (event: IKafkaEvent, context: any) => {
  const { type, data } = event;

  if (!data?.userId) {
    console.error(`⚠️ Received event ${type} without userId. Skipping.`);
    return;
  }

  switch (type) {
    case EVENT_TYPES.SHOP_STATUS_CHANGED:
      await handleShopStatusChanged(data);
      break;
    default:
      console.log(`⚠️ Unknown event type: ${type}`);
  }


}


const handleShopStatusChanged = async (data: any) => {
  const { shopId, userId, newStatus, reason } = data;

  if (newStatus === "active") {
    await UserProfile.findOneAndUpdate(
      { userId: userId },
      { $set: { isActive: true } },
      { new: true }
    );
  } else if (newStatus === "inactive") {
    await UserProfile.findOneAndUpdate(
      { userId },
      { $set: { isActive: false } },
      { new: true }
    );
  }
  else if (newStatus === "suspended") {
    await UserProfile.findOneAndUpdate(
      { userId },
      { $set: { isActive: false } },
      { new: true }
    );
  }

  if (newStatus === "active") {
    await KafkaManager.publish({
      topic: config.kafka.topics.userEvents,
      eventType: EVENT_TYPES.USER_REACTIVATED,
      payload: {
        userId: userId,
        reason,
      },
    });
  }
  else if (newStatus === "inactive") {
    await KafkaManager.publish({
      topic: config.kafka.topics.userEvents,
      eventType: EVENT_TYPES.USER_DEACTIVATED,
      payload: {
        userId: userId,
        reason,
      },
    });
  }
  else if (newStatus === "suspended") {
    await KafkaManager.publish({
      topic: config.kafka.topics.userEvents,
      eventType: EVENT_TYPES.USER_DEACTIVATED,
      payload: {
        userId: userId,
        reason,
      },
    });
  }
  console.log(`✅ Shop status updated to ${newStatus}: ${shopId}`);
};