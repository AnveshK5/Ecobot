import type { SafeUser } from "../utils/auth.js";

declare global {
  namespace Express {
    interface Request {
      user?: SafeUser;
    }
  }
}

export {};
