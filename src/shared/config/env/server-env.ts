import "server-only";

import { parseServerEnv, serverEnvSchema, type ServerEnv } from "./server-env-schema";

export { parseServerEnv, serverEnvSchema, type ServerEnv };

export function getServerEnv(): ServerEnv {
  return parseServerEnv(process.env);
}
