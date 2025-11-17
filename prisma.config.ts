import { defineConfig, env } from "prisma/config";

// Load environment variables from .env file
try {
  require("dotenv").config();
} catch (e) {
  // dotenv not available during Prisma generation
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  engine: "classic",
  datasource: {
    url: env("DATABASE_URL"),
  },
});
