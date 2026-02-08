"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const unitRepo_1 = require("../repositories/unitRepo");
const router = (0, express_1.Router)();
// Helper function to serialize BigInt values
function serializeBigInt(obj) {
    return Object.fromEntries(Object.entries(obj).map(([key, value]) => {
        if (typeof value === "bigint") {
            return [key, value.toString()];
        }
        if (Array.isArray(value)) {
            return [key, value.map((item) => typeof item === "object" && item !== null ? serializeBigInt(item) : item)];
        }
        if (typeof value === "object" && value !== null) {
            return [key, serializeBigInt(value)];
        }
        return [key, value];
    }));
}
router.get("/", async (_req, res) => {
    try {
        const units = await (0, unitRepo_1.listUnits)(10);
        const serializedUnits = units.map((unit) => serializeBigInt(unit));
        res.json({ data: serializedUnits });
    }
    catch (err) {
        res.status(500).json({ error: "Failed to fetch units" });
    }
});
exports.default = router;
