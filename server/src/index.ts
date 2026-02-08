import "dotenv/config";

import app from "./app";
import prisma from "./prisma";

const PORT = Number(process.env.PORT) || 3000;

async function start() {
  try {
    await prisma.$connect();
    console.log("Database connected successfully");

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error("Failed to start server:", err);
    process.exit(1);
  }
}

start();
