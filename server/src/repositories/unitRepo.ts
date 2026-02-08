import prisma from "../prisma";

export async function listUnits(limit = 10) {
  return prisma.units.findMany({
    take: limit,
    orderBy: { id: "asc" },
  });
}
