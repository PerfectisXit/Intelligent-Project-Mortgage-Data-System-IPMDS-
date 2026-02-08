import { Router } from "express";

import { listUnits } from "../repositories/unitRepo";

const router = Router();

router.get("/", async (_req, res) => {
  try {
    const units = await listUnits(10);
    res.json({ data: units });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch units" });
  }
});

export default router;
