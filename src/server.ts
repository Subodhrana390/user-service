import dotenv from "dotenv";
dotenv.config();
import app from "./app.js";
import { KafkaManager } from "./infra/kafka/index.js";
import { handleUserEvents } from "./events/userEventHandler.js";
import mongoose from "mongoose";
import { config } from "./config/index.js";

const PORT = config.service.port || 3002;

const startServer = async () => {
    try {
        await mongoose.connect(config.mongodb.uri);
        const server = app.listen(PORT, () => {
            console.log(`🚀 User Service running on port ${PORT}`);
        });

        await KafkaManager.subscribe({
            topic: config.kafka.topics.userEvents,
            groupId: config.kafka.groupId,
            handler: handleUserEvents,
        });

        const shutdown = async (signal: NodeJS.Signals) => {
            console.log(`\n🛑 ${signal} received. Shutting down...`);

            server.close(async () => {
                console.log("📡 HTTP server closed.");

                await KafkaManager.shutdown();
                process.exit(0);
            });
        };

        process.on("SIGINT", shutdown);
        process.on("SIGTERM", shutdown);
    } catch (error) {
        console.error("❌ Service startup failed:", error);
        process.exit(1);
    }
};

startServer();
