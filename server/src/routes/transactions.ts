import { Router } from "express";

import prisma from "../prisma";

const router = Router();

// Helper function to serialize BigInt values
function serializeBigInt(obj: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(obj).map(([key, value]) => {
      if (typeof value === "bigint") {
        return [key, value.toString()];
      }
      return [key, value];
    })
  );
}

router.post("/", async (req, res) => {
  try {
    const {
      unit_no,
      buyer_name,
      amount,
      currency = "CNY",
      txn_type,
      occurred_at,
      memo,
    } = req.body || {};

    if (!unit_no || !amount || !txn_type) {
      return res.status(400).json({
        error: "unit_no, amount, and txn_type are required",
      });
    }

    // Find the unit by unit_no
    const unit = await prisma.units.findFirst({
      where: { unit_no: String(unit_no) },
    });

    if (!unit) {
      return res.status(404).json({
        error: `Unit not found: ${unit_no}`,
      });
    }

    const transaction = await prisma.transactions.create({
      data: {
        unit_id: unit.id,
        txn_type: String(txn_type),
        amount: Number(amount),
        currency: String(currency),
        occurred_at: occurred_at ? new Date(occurred_at) : new Date(),
        memo: memo ? String(memo) : null,
      },
    });

    const safe = serializeBigInt(transaction as unknown as Record<string, unknown>);
    res.json({ success: true, data: safe });
  } catch (err) {
    console.error("Failed to create transaction:", err);
    res.status(500).json({ error: "Failed to create transaction" });
  }
});

export default router;
