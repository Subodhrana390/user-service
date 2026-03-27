import dotenv from "dotenv";
import fs from 'fs';

dotenv.config({});

const caPath = '/etc/secrets/ca.pem';

const getCA = (): string[] | undefined => {
  if (fs.existsSync(caPath)) {
    return [fs.readFileSync(caPath, 'utf-8')];
  }
  return undefined;
};

export interface Config {
  env: string;
  isProduction: boolean;
  service: {
    port: number;
  };
  mongodb: {
    uri: string;
  };
  jwt: {
    accessSecret: string;
    accessTokenExpireIn: string;
  };
  kafka: {
    brokers: string;
    clientId: string;
    groupId: string;
    retries: number;
    retryDelay: number;
    ssl: boolean | { rejectUnauthorized: boolean; ca?: string[] };
    sasl: {
      mechanism: "plain" | "scram-sha-256" | "scram-sha-512",
      username: string;
      password: string;
    };
    connectionTimeout: number;
    requestTimeout: number;
    topics: {
      userEvents: string;
      shopEvents: string;
    };
  };
  cloudinary: {
    cloudname: string;
    apiKey: string;
    apiSecret: string;
  };
}

const nodeEnv = process.env.NODE_ENV || 'development';

export const config: Config = {
  env: nodeEnv,
  isProduction: nodeEnv === "production",
  service: {
    port: Number(process.env.APP_USER_SERVICE_PORT || "3002"),
  },
  mongodb: {
    uri: process.env.APP_USER_MONGO_URI!,
  },
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET!,
    accessTokenExpireIn: process.env.JWT_ACCESS_EXPIRE_IN || "15m",
  },
  kafka: {
    brokers: process.env.APP_KAFKA_BROKER!,
    clientId: process.env.APP_USER_KAFKA_CLIENT_ID!,
    groupId: process.env.APP_USER_KAFKA_GROUP_ID!,
    sasl: {
      mechanism: process.env.APP_KAFKA_SASL_MECHANISM! as "plain" | "scram-sha-256" | "scram-sha-512",
      username: process.env.APP_KAFKA_SASL_USERNAME!,
      password: process.env.APP_KAFKA_SASL_PASSWORD!,
    },
    ssl: getCA() ? { rejectUnauthorized: true, ca: getCA() } : (process.env.APP_KAFKA_SSL === "true"),
    retries: Number(process.env.APP_KAFKA_RETRIES || 5),
    retryDelay: Number(process.env.APP_KAFKA_RETRY_DELAY || 1000),
    connectionTimeout: Number(process.env.APP_KAFKA_CONNECTION_TIMEOUT),
    requestTimeout: Number(process.env.APP_KAFKA_REQUEST_TIMEOUT),
    topics: {
      userEvents: process.env.KAFKA_TOPIC_USER_EVENTS!,
      shopEvents: process.env.KAFKA_TOPIC_SHOP_EVENTS!,
    },
  },
  cloudinary: {
    cloudname: process.env.APP_CLOUDINARY_CLOUD_NAME!,
    apiKey: process.env.APP_CLOUDINARY_API_KEY!,
    apiSecret: process.env.APP_CLOUDINARY_API_SECRET!,
  },
};
