import request from "supertest";
import { describe, expect, it } from "vitest";

import { createApp } from "../src/app";

const app = createApp();

async function login() {
  const response = await request(app).post("/api/auth/login").send({
    email: "owner@autogmail.local",
    password: "Password123!",
  });

  expect(response.status).toBe(200);
  expect(response.body.accessToken).toEqual(expect.any(String));

  return response.body.accessToken as string;
}

describe("Auto-Gmail-code API", () => {
  it("autentica al usuario demo y devuelve su workspace", async () => {
    const token = await login();

    const response = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.user.email).toBe("owner@autogmail.local");
    expect(response.body.workspace.name).toBe("Auto-Gmail-code Demo");
  });

  it("lista cuentas Gmail y permite iniciar OAuth sin pedir contrasena Gmail", async () => {
    const token = await login();

    const accounts = await request(app)
      .get("/api/gmail/accounts")
      .set("Authorization", `Bearer ${token}`);

    expect(accounts.status).toBe(200);
    expect(accounts.body.data.length).toBeGreaterThan(0);

    const oauth = await request(app)
      .post("/api/gmail/oauth/start")
      .set("Authorization", `Bearer ${token}`);

    expect(oauth.status).toBe(201);
    expect(oauth.body.data.authUrl).toEqual(expect.any(String));
    expect(JSON.stringify(oauth.body).toLowerCase()).not.toContain("password");

    const callback = await request(app).get(
      `/api/gmail/oauth/callback?code=demo-code&state=${oauth.body.data.state as string}`,
    );

    expect(callback.status).toBe(302);
    expect(callback.headers.location).toContain("oauth=success");
  });

  it("lista correos filtrados y corrige clasificacion manualmente", async () => {
    const token = await login();

    const inbox = await request(app)
      .get("/api/emails?category=SECURITY&minSecurityScore=80")
      .set("Authorization", `Bearer ${token}`);

    expect(inbox.status).toBe(200);
    expect(inbox.body.data[0].classification.primaryCategory).toBe("SECURITY");

    const emailId = inbox.body.data[0].id as string;
    const correction = await request(app)
      .patch(`/api/emails/${emailId}/classification`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        primaryCategory: "REVIEW",
        secondaryCategories: ["SECURITY"],
        explanation: "Correccion manual para revisar con el equipo.",
      });

    expect(correction.status).toBe(200);
    expect(correction.body.data.classification.primaryCategory).toBe("REVIEW");
  });

  it("resuelve alertas y registra la accion en auditoria", async () => {
    const token = await login();

    const alerts = await request(app)
      .get("/api/alerts?status=NEW")
      .set("Authorization", `Bearer ${token}`);

    expect(alerts.status).toBe(200);
    const alertId = alerts.body.data[0].id as string;

    const resolved = await request(app)
      .post(`/api/alerts/${alertId}/resolve`)
      .set("Authorization", `Bearer ${token}`);

    expect(resolved.status).toBe(200);
    expect(resolved.body.data.status).toBe("RESOLVED");

    const audit = await request(app)
      .get("/api/audit?action=ALERT_RESOLVED")
      .set("Authorization", `Bearer ${token}`);

    expect(audit.status).toBe(200);
    expect(audit.body.data[0].action).toBe("ALERT_RESOLVED");
  });

  it("crea reglas y expone analitica basica", async () => {
    const token = await login();

    const rule = await request(app)
      .post("/api/rules")
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "Clientes importantes",
        description: "Marca dominios de clientes como importantes.",
        priority: 30,
        conditions: [{ field: "fromDomain", operator: "contains", value: "client" }],
        actions: [{ type: "markImportant", value: true }],
      });

    expect(rule.status).toBe(201);
    expect(rule.body.data.enabled).toBe(true);

    const summary = await request(app)
      .get("/api/analytics/summary")
      .set("Authorization", `Bearer ${token}`);

    expect(summary.status).toBe(200);
    expect(summary.body.data.totalEmails).toBeGreaterThan(0);
  });

  it("expone configuracion del workspace y contrato OpenAPI", async () => {
    const token = await login();

    const settings = await request(app)
      .get("/api/settings")
      .set("Authorization", `Bearer ${token}`);

    expect(settings.status).toBe(200);
    expect(settings.body.data.theme).toBe("system");

    const updatedSettings = await request(app)
      .patch("/api/settings")
      .set("Authorization", `Bearer ${token}`)
      .send({
        ...settings.body.data,
        theme: "dark",
      });

    expect(updatedSettings.status).toBe(200);
    expect(updatedSettings.body.data.theme).toBe("dark");

    const openapi = await request(app).get("/api/openapi.json");

    expect(openapi.status).toBe(200);
    expect(openapi.body.openapi).toBe("3.0.3");
    expect(openapi.body.paths["/emails"]).toBeDefined();
  });
});
