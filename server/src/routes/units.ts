import { Router } from "express";

import { listUnits } from "../repositories/unitRepo";

const router = Router();

// Helper function to serialize BigInt values
function serializeBigInt(obj: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(obj).map(([key, value]) => {
      if (typeof value === "bigint") {
        return [key, value.toString()];
      }
      if (Array.isArray(value)) {
        return [key, value.map((item) =>
          typeof item === "object" && item !== null ? serializeBigInt(item as Record<string, unknown>) : item
        )];
      }
      if (typeof value === "object" && value !== null) {
        return [key, serializeBigInt(value as Record<string, unknown>)];
      }
      return [key, value];
    })
  );
}

router.get("/", async (_req, res) => {
  try {
    const units = await listUnits(10);
    const serializedUnits = units.map((unit) => serializeBigInt(unit as unknown as Record<string, unknown>));
    res.json({ data: serializedUnits });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch units" });
  }
});

export default router;
