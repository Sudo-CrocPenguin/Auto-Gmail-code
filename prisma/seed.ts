import { hash } from "bcryptjs";

import { PrismaClient } from "@prisma/client";

import { defaultWorkspaceSettings } from "../src/features/settings/domain/workspace-settings.entity";

const prisma = new PrismaClient();

const workspaceId = "workspace_demo";
const ownerId = "user_owner_demo";

async function main() {
  await prisma.workspace.upsert({
    where: { id: workspaceId },
    create: {
      id: workspaceId,
      name: "Auto-Gmail-code Demo",
      ownerId,
      plan: "starter",
      createdAt: new Date("2026-06-01T08:00:00.000Z"),
      settings: defaultWorkspaceSettings,
    },
    update: {
      name: "Auto-Gmail-code Demo",
      settings: defaultWorkspaceSettings,
    },
  });

  await prisma.user.upsert({
    where: { email: "owner@autogmail.local" },
    create: {
      id: ownerId,
      workspaceId,
      name: "Usuario Demo",
      email: "owner@autogmail.local",
      passwordHash: await hash("Password123!", 10),
      role: "OWNER",
      createdAt: new Date("2026-06-01T08:00:00.000Z"),
    },
    update: {
      workspaceId,
      role: "OWNER",
    },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });

