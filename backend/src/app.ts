import cors from "cors";
import express from "express";
import morgan from "morgan";
import { env } from "./config/env.js";
import { errorHandler, notFoundHandler } from "./middleware/error-handler.js";
import routes from "./routes/index.js";

export function createApp() {
  const app = express();

  app.use(
    cors({
      origin: env.FRONTEND_URL,
      credentials: true
    })
  );
  app.use(express.json({ limit: "1mb" }));
  app.use(morgan("dev"));

  app.use("/api", routes);
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
