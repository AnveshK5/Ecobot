import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import morgan from "morgan";
import { env } from "./config/env.js";
import { errorHandler, notFoundHandler } from "./middleware/error-handler.js";
import routes from "./routes/index.js";

export function createApp() {
  const app = express();
  const allowedOrigins = new Set([
    env.FRONTEND_URL,
    "http://localhost:8080",
    "http://localhost:8081",
    "http://localhost:8082",
    "http://localhost:8083",
    "http://localhost:8084",
    "http://127.0.0.1:8080",
    "http://127.0.0.1:8081",
    "http://127.0.0.1:8082",
    "http://127.0.0.1:8083",
    "http://127.0.0.1:8084",
    "http://10.1.63.51:8080",
    "http://10.1.63.51:8081",
    "http://10.1.63.51:8082",
    "http://10.1.63.51:8083",
    "http://10.1.63.51:8084",
    "http://10.0.229.128:8080",
    "http://10.0.229.128:8081",
    "http://10.0.229.128:8082",
    "http://10.0.229.128:8083",
    "http://10.0.229.128:8084",
    "http://192.168.1.61:8080",
    "http://192.168.1.61:8081",
    "http://192.168.1.61:8082",
    "http://192.168.1.61:8083",
    "http://192.168.1.61:8084"
  ]);

  app.use(
    cors({
      origin(origin, callback) {
        if (!origin || allowedOrigins.has(origin)) {
          callback(null, true);
          return;
        }
        callback(new Error(`Origin ${origin} is not allowed by CORS`));
      },
      credentials: true
    })
  );
  app.use(cookieParser());
  app.use(express.json({ limit: "1mb" }));
  app.use(morgan("dev"));

  app.use("/api", routes);
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
