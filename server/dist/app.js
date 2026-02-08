"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const cors_1 = __importDefault(require("cors"));
const express_1 = __importDefault(require("express"));
const ai_1 = __importDefault(require("./routes/ai"));
const chat_1 = __importDefault(require("./routes/chat"));
const transactions_1 = __importDefault(require("./routes/transactions"));
const units_1 = __importDefault(require("./routes/units"));
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use("/api/units", units_1.default);
app.use("/api/chat", chat_1.default);
app.use("/api/ai", ai_1.default);
app.use("/api/transactions", transactions_1.default);
exports.default = app;
