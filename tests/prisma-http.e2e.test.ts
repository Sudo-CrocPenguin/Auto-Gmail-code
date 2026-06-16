import { randomUUID } from "node:crypto";

import { PrismaClient } from "@prisma/client";
import type { Express } from "express";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

const databaseUrl = process.env.PRISMA_TEST_DATABASE_URL;

if (!databaseUrl) {
  describe.skip("Prisma HTTP API", () => {
    it("requiere PRISMA_TEST_DATABASE_URL", () => {
      expect(databaseUrl).toBeUndefined();
    });
  });
} else {
  describe("Prisma HTTP API", () => {
    let app: Express;
    let prisma: PrismaClient;

    beforeAll(async () => {
      vi.resetModules();
      process.env.NODE_ENV = "test";
      process.env.PERSISTENCE_DRIVER = "prisma";
      process.env.DATABASE_URL = databaseUrl;
      process.env.JWT_SECRET = "test-jwt-secret-with-enough-length";
      process.env.TOKEN_ENCRYPTION_KEY = "test-token-encryption-key-with-enough-length";
      process.env.FRONTEND_URL = "http://localhost:3000";
      process.env.GOOGLE_CLIENT_ID = "";
      process.env.GOOGLE_CLIENT_SECRET = "";

      const module = await import("../src/app");
      app = module.createApp();
      prisma = new PrismaClient({
        datasources: {
          db: {
            url: databaseUrl,
          },
        },
      });
    });

    afterAll(async () => {
      await prisma.$disconnect();
    });

    it("registra usuario, persiste sesion y revoca logout con Prisma", async () => {
      const suffix = randomUUID();
      const registration = await registerUser(app, suffix);

      expect(registration.status).toBe(201);
      expect(registration.body.accessToken).toEqual(expect.any(String));

      const sessions = await prisma.appSession.findMany({
        where: {
          userId: registration.body.user.id as string,
          revokedAt: null,
        },
      });
      expect(sessions).toHaveLength(1);

      const token = registration.body.accessToken as string;
      const me = await request(app).get("/api/auth/me").set("Authorization", `Bearer ${token}`);
      expect(me.status).toBe(200);
      expect(me.body.user.email).toBe(`prisma-http-${suffix}@autogmail.local`);

      const logout = await request(app).post("/api/auth/logout").set("Authorization", `Bearer ${token}`);
      expect(logout.status).toBe(200);

      const revoked = await prisma.appSession.findUnique({ where: { id: sessions[0]?.id } });
      expect(revoked?.revokedAt).toBeTruthy();

      const rejected = await request(app).get("/api/auth/me").set("Authorization", `Bearer ${token}`);
      expect(rejected.status).toBe(401);
    });

    it("consume state OAuth una sola vez con Prisma", async () => {
      const suffix = randomUUID();
      const registration = await registerUser(app, suffix);
      const token = registration.body.accessToken as string;

      const oauth = await request(app)
        .post("/api/gmail/oauth/start")
        .set("Authorization", `Bearer ${token}`);

      expect(oauth.status).toBe(201);
      const state = oauth.body.data.state as string;

      const callback = await request(app).get(`/api/gmail/oauth/callback?code=demo-code&state=${state}`);
      expect(callback.status).toBe(302);
      expect(callback.headers.location).toContain("oauth=success");

      const replay = await request(app).get(`/api/gmail/oauth/callback?code=demo-code&state=${state}`);
      expect(replay.status).toBe(302);
      expect(replay.headers.location).toContain("oauth=error");
    });

    it("rechaza sync Prisma sin credenciales OAuth reales", async () => {
      const suffix = randomUUID();
      const registration = await registerUser(app, suffix);
      const token = registration.body.accessToken as string;
      const workspaceId = registration.body.workspace.id as string;
      const gmailAccountId = `gmail_http_${suffix}`;

      await prisma.gmailAccount.create({
        data: {
          id: gmailAccountId,
          workspaceId,
          emailAddress: `real-${suffix}@gmail.com`,
          status: "CONNECTED",
          lastSyncAt: null,
          watchExpiration: null,
          totalMessages: 0,
          grantedScopes: ["https://www.googleapis.com/auth/gmail.readonly"],
          errorMessage: null,
          historyId: null,
          createdAt: new Date(),
        },
      });

      const sync = await request(app)
        .post(`/api/gmail/accounts/${gmailAccountId}/sync`)
        .set("Authorization", `Bearer ${token}`);

      expect(sync.status).toBe(409);
      expect(sync.body.error.code).toBe("GMAIL_RECONNECT_REQUIRED");

      const account = await prisma.gmailAccount.findUnique({ where: { id: gmailAccountId } });
      expect(account?.status).toBe("RECONNECT_REQUIRED");
    });
  });
}

function registerUser(app: Express, suffix: string) {
  return request(app)
    .post("/api/auth/register")
    .send({
      name: "Prisma HTTP",
      email: `prisma-http-${suffix}@autogmail.local`,
      password: "Password123!",
      workspaceName: `Workspace HTTP ${suffix}`,
      acceptTerms: true,
    });
}
