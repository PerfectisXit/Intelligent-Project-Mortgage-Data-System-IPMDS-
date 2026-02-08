import cors from "cors";
import express from "express";

import aiRouter from "./routes/ai";
import chatRouter from "./routes/chat";
import transactionsRouter from "./routes/transactions";
import unitsRouter from "./routes/units";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/units", unitsRouter);
app.use("/api/chat", chatRouter);
app.use("/api/ai", aiRouter);
app.use("/api/transactions", transactionsRouter);

export default app;
