import cors from "cors";
import express from "express";

import unitsRouter from "./routes/units";
import chatRouter from "./routes/chat";
import aiRouter from "./routes/ai";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/units", unitsRouter);
app.use("/api/chat", chatRouter);
app.use("/api/ai", aiRouter);

export default app;
