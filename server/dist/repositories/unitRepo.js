"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.listUnits = listUnits;
const prisma_1 = __importDefault(require("../prisma"));
async function listUnits(limit = 10) {
    return prisma_1.default.units.findMany({
        take: limit,
        orderBy: { id: "asc" },
    });
}
