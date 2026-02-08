"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const unitRepo_1 = require("../repositories/unitRepo");
const router = (0, express_1.Router)();
router.get("/", async (_req, res) => {
    try {
        const units = await (0, unitRepo_1.listUnits)(10);
        res.json({ data: units });
    }
    catch (err) {
        res.status(500).json({ error: "Failed to fetch units" });
    }
});
exports.default = router;
