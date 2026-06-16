const errorResponse = {
  description: "Error de API",
  content: {
    "application/json": {
      schema: { $ref: "#/components/schemas/ErrorEnvelope" },
    },
  },
} as const;

const validationErrorResponse = {
  description: "Datos invalidos",
  content: {
    "application/json": {
      schema: { $ref: "#/components/schemas/ErrorEnvelope" },
    },
  },
} as const;

const unauthorizedResponse = {
  description: "Sesion ausente, invalida o expirada",
  content: {
    "application/json": {
      schema: { $ref: "#/components/schemas/ErrorEnvelope" },
    },
  },
} as const;

const forbiddenResponse = {
  description: "Permisos insuficientes",
  content: {
    "application/json": {
      schema: { $ref: "#/components/schemas/ErrorEnvelope" },
    },
  },
} as const;

const notFoundResponse = {
  description: "Recurso no encontrado",
  content: {
    "application/json": {
      schema: { $ref: "#/components/schemas/ErrorEnvelope" },
    },
  },
} as const;

const rateLimitResponse = {
  description: "Demasiadas solicitudes",
  content: {
    "application/json": {
      schema: { $ref: "#/components/schemas/ErrorEnvelope" },
    },
  },
} as const;

const idPathParameter = {
  name: "id",
  in: "path",
  required: true,
  schema: { type: "string" },
} as const;

const paginationParameters = [
  { name: "page", in: "query", schema: { type: "integer", default: 1, minimum: 1 } },
  { name: "limit", in: "query", schema: { type: "integer", default: 25, minimum: 1, maximum: 100 } },
] as const;

export const openApiDocument = {
  openapi: "3.0.3",
  info: {
    title: "Auto-Gmail-code API",
    version: "0.1.0",
    description:
      "Backend API para conectar Gmail via OAuth, sincronizar correos, clasificarlos y operar alertas, reglas, remitentes, analitica y auditoria.",
  },
  servers: [{ url: "/api" }],
  security: [{ bearerAuth: [] }],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
    },
    schemas: {
      ErrorEnvelope: {
        type: "object",
        required: ["error"],
        properties: {
          error: {
            type: "object",
            required: ["code", "message"],
            properties: {
              code: { type: "string", example: "VALIDATION_ERROR" },
              message: { type: "string", example: "Los datos enviados no son validos." },
              details: { type: "object", additionalProperties: true },
            },
          },
        },
      },
      Pagination: {
        type: "object",
        required: ["page", "limit", "total", "totalPages"],
        properties: {
          page: { type: "integer", example: 1 },
          limit: { type: "integer", example: 25 },
          total: { type: "integer", example: 100 },
          totalPages: { type: "integer", example: 4 },
        },
      },
      PublicUser: {
        type: "object",
        required: ["id", "name", "email", "role", "createdAt"],
        properties: {
          id: { type: "string" },
          name: { type: "string" },
          email: { type: "string", format: "email" },
          role: { type: "string", enum: ["OWNER", "ADMIN", "MEMBER"] },
          createdAt: { type: "string", format: "date-time" },
        },
      },
      Workspace: {
        type: "object",
        required: ["id", "name", "ownerId", "plan", "createdAt"],
        properties: {
          id: { type: "string" },
          name: { type: "string" },
          ownerId: { type: "string" },
          plan: { type: "string", example: "starter" },
          createdAt: { type: "string", format: "date-time" },
        },
      },
      AuthResponse: {
        type: "object",
        required: ["accessToken", "user", "workspace"],
        properties: {
          accessToken: { type: "string" },
          user: { $ref: "#/components/schemas/PublicUser" },
          workspace: { $ref: "#/components/schemas/Workspace" },
        },
      },
      GmailAccount: {
        type: "object",
        required: [
          "id",
          "workspaceId",
          "emailAddress",
          "status",
          "lastSyncAt",
          "watchExpiration",
          "totalMessages",
          "historyId",
          "grantedScopes",
          "errorMessage",
          "createdAt",
        ],
        properties: {
          id: { type: "string" },
          workspaceId: { type: "string" },
          emailAddress: { type: "string", format: "email" },
          status: {
            type: "string",
            enum: ["CONNECTED", "SYNCING", "ERROR", "DISCONNECTED", "RECONNECT_REQUIRED"],
          },
          lastSyncAt: { type: "string", format: "date-time", nullable: true },
          watchExpiration: { type: "string", format: "date-time", nullable: true },
          totalMessages: { type: "integer" },
          historyId: { type: "string", nullable: true },
          grantedScopes: { type: "array", items: { type: "string" } },
          errorMessage: { type: "string", nullable: true },
          createdAt: { type: "string", format: "date-time" },
        },
      },
      GmailSyncLog: {
        type: "object",
        required: [
          "id",
          "workspaceId",
          "gmailAccountId",
          "status",
          "startedAt",
          "finishedAt",
          "fetchedMessages",
          "createdMessages",
          "updatedMessages",
          "errorMessage",
          "metadata",
        ],
        properties: {
          id: { type: "string" },
          workspaceId: { type: "string" },
          gmailAccountId: { type: "string" },
          status: { type: "string", enum: ["RUNNING", "COMPLETED", "FAILED", "SKIPPED"] },
          startedAt: { type: "string", format: "date-time" },
          finishedAt: { type: "string", format: "date-time", nullable: true },
          fetchedMessages: { type: "integer" },
          createdMessages: { type: "integer" },
          updatedMessages: { type: "integer" },
          errorMessage: { type: "string", nullable: true },
          metadata: { type: "object", additionalProperties: true },
        },
      },
      EmailClassification: {
        type: "object",
        required: [
          "id",
          "emailMessageId",
          "primaryCategory",
          "secondaryCategories",
          "importanceScore",
          "spamScore",
          "riskScore",
          "securityScore",
          "actionRequired",
          "explanation",
          "createdAt",
          "updatedAt",
        ],
        properties: {
          id: { type: "string" },
          emailMessageId: { type: "string" },
          primaryCategory: { type: "string" },
          secondaryCategories: { type: "array", items: { type: "string" } },
          importanceScore: { type: "number", minimum: 0, maximum: 100 },
          spamScore: { type: "number", minimum: 0, maximum: 100 },
          riskScore: { type: "number", minimum: 0, maximum: 100 },
          securityScore: { type: "number", minimum: 0, maximum: 100 },
          actionRequired: { type: "boolean" },
          explanation: { type: "string" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      EmailMessage: {
        type: "object",
        required: [
          "id",
          "workspaceId",
          "gmailAccountId",
          "gmailMessageId",
          "threadId",
          "accountEmail",
          "fromEmail",
          "fromDomain",
          "toEmails",
          "subject",
          "snippet",
          "receivedAt",
          "labelIds",
          "hasAttachments",
          "attachments",
          "isRead",
          "isSpam",
          "isImportant",
          "classification",
        ],
        properties: {
          id: { type: "string" },
          workspaceId: { type: "string" },
          gmailAccountId: { type: "string" },
          gmailMessageId: { type: "string" },
          threadId: { type: "string" },
          accountEmail: { type: "string", format: "email" },
          fromEmail: { type: "string", format: "email" },
          fromName: { type: "string", nullable: true },
          fromDomain: { type: "string" },
          toEmails: { type: "array", items: { type: "string", format: "email" } },
          subject: { type: "string" },
          snippet: { type: "string" },
          bodyHtml: { type: "string", nullable: true },
          receivedAt: { type: "string", format: "date-time" },
          labelIds: { type: "array", items: { type: "string" } },
          hasAttachments: { type: "boolean" },
          attachments: { type: "array", items: { type: "object", additionalProperties: true } },
          isRead: { type: "boolean" },
          isSpam: { type: "boolean" },
          isImportant: { type: "boolean" },
          reviewedAt: { type: "string", format: "date-time", nullable: true },
          gmailUrl: { type: "string", nullable: true },
          classification: {
            oneOf: [{ $ref: "#/components/schemas/EmailClassification" }, { type: "null" }],
          },
          actionHistory: { type: "array", items: { type: "object", additionalProperties: true } },
          attachmentCount: { type: "integer" },
        },
      },
      Alert: {
        type: "object",
        required: ["id", "workspaceId", "gmailAccountId", "type", "severity", "title", "description", "status", "recommendedAction", "createdAt"],
        properties: {
          id: { type: "string" },
          workspaceId: { type: "string" },
          gmailAccountId: { type: "string" },
          emailMessageId: { type: "string", nullable: true },
          type: { type: "string" },
          severity: { type: "string", enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"] },
          title: { type: "string" },
          description: { type: "string" },
          status: { type: "string", enum: ["NEW", "RESOLVED", "IGNORED"] },
          recommendedAction: { type: "string" },
          createdAt: { type: "string", format: "date-time" },
          resolvedAt: { type: "string", format: "date-time", nullable: true },
        },
      },
      SenderProfile: {
        type: "object",
        required: ["id", "workspaceId", "email", "domain", "totalMessages", "lastSeenAt", "trustScore", "riskScore", "status"],
        properties: {
          id: { type: "string" },
          workspaceId: { type: "string" },
          email: { type: "string", format: "email" },
          domain: { type: "string" },
          displayName: { type: "string", nullable: true },
          totalMessages: { type: "integer" },
          lastSeenAt: { type: "string", format: "date-time" },
          trustScore: { type: "integer" },
          riskScore: { type: "integer" },
          category: { type: "string", nullable: true },
          status: { type: "string", enum: ["TRUSTED", "NORMAL", "SUSPICIOUS", "BLOCKED"] },
        },
      },
      AutomationRule: {
        type: "object",
        required: ["id", "workspaceId", "name", "conditions", "actions", "priority", "enabled", "timesApplied", "createdAt", "updatedAt"],
        properties: {
          id: { type: "string" },
          workspaceId: { type: "string" },
          name: { type: "string" },
          description: { type: "string", nullable: true },
          conditions: { type: "array", items: { type: "object", additionalProperties: true } },
          actions: { type: "array", items: { type: "object", additionalProperties: true } },
          priority: { type: "integer" },
          enabled: { type: "boolean" },
          timesApplied: { type: "integer" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      AuditLog: {
        type: "object",
        required: ["id", "workspaceId", "action", "entityType", "description", "metadata", "createdAt"],
        properties: {
          id: { type: "string" },
          workspaceId: { type: "string" },
          userId: { type: "string", nullable: true },
          action: { type: "string" },
          entityType: { type: "string" },
          entityId: { type: "string", nullable: true },
          description: { type: "string" },
          ip: { type: "string", nullable: true },
          metadata: { type: "object", additionalProperties: true },
          createdAt: { type: "string", format: "date-time" },
        },
      },
      WorkspaceSettings: {
        type: "object",
        additionalProperties: true,
        properties: {
          theme: { type: "string", enum: ["light", "dark", "system"] },
          language: { type: "string" },
          notifications: { type: "object", additionalProperties: true },
          classification: { type: "object", additionalProperties: true },
          retention: { type: "object", additionalProperties: true },
        },
      },
      OAuthStartResponse: {
        type: "object",
        required: ["authUrl", "state", "configured"],
        properties: {
          authUrl: { type: "string" },
          state: { type: "string" },
          configured: { type: "boolean" },
        },
      },
    },
  },
  paths: {
    "/health": {
      get: {
        security: [],
        summary: "Healthcheck",
        responses: {
          "200": {
            description: "Servicio disponible",
            content: { "application/json": { schema: { type: "object", additionalProperties: true } } },
          },
        },
      },
    },
    "/health/ready": {
      get: {
        security: [],
        summary: "Readiness operativo",
        responses: {
          "200": {
            description: "Dependencias operativas disponibles",
            content: { "application/json": { schema: { type: "object", additionalProperties: true } } },
          },
          "503": {
            description: "Una dependencia obligatoria no esta disponible",
            content: { "application/json": { schema: { type: "object", additionalProperties: true } } },
          },
        },
      },
    },
    "/auth/register": {
      post: {
        security: [],
        summary: "Registrar usuario propietario",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name", "email", "password", "workspaceName", "acceptTerms"],
                properties: {
                  name: { type: "string" },
                  email: { type: "string", format: "email" },
                  password: { type: "string", minLength: 8 },
                  workspaceName: { type: "string" },
                  acceptTerms: { type: "boolean" },
                },
              },
            },
          },
        },
        responses: {
          "201": { description: "Usuario registrado", content: { "application/json": { schema: { $ref: "#/components/schemas/AuthResponse" } } } },
          "400": validationErrorResponse,
          "409": errorResponse,
        },
      },
    },
    "/auth/login": {
      post: {
        security: [],
        summary: "Iniciar sesion",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "password"],
                properties: {
                  email: { type: "string", format: "email" },
                  password: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "Sesion iniciada", content: { "application/json": { schema: { $ref: "#/components/schemas/AuthResponse" } } } },
          "400": validationErrorResponse,
          "401": unauthorizedResponse,
          "429": rateLimitResponse,
        },
      },
    },
    "/auth/logout": {
      post: {
        summary: "Cerrar sesion",
        responses: {
          "200": { description: "Sesion cerrada", content: { "application/json": { schema: { type: "object", properties: { success: { type: "boolean" } } } } } },
          "401": unauthorizedResponse,
        },
      },
    },
    "/auth/me": {
      get: {
        summary: "Usuario autenticado",
        responses: {
          "200": {
            description: "Usuario y workspace autenticados",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["user", "workspace"],
                  properties: {
                    user: { $ref: "#/components/schemas/PublicUser" },
                    workspace: { $ref: "#/components/schemas/Workspace" },
                  },
                },
              },
            },
          },
          "401": unauthorizedResponse,
        },
      },
    },
    "/workspaces/current": {
      get: {
        summary: "Obtener workspace actual",
        responses: {
          "200": { description: "Workspace actual", content: { "application/json": { schema: { type: "object", properties: { data: { $ref: "#/components/schemas/Workspace" } } } } } },
          "401": unauthorizedResponse,
        },
      },
      patch: {
        summary: "Actualizar workspace actual",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  plan: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "Workspace actualizado", content: { "application/json": { schema: { type: "object", properties: { data: { $ref: "#/components/schemas/Workspace" } } } } } },
          "401": unauthorizedResponse,
          "403": forbiddenResponse,
        },
      },
    },
    "/gmail/accounts": {
      get: {
        summary: "Listar cuentas Gmail",
        responses: {
          "200": {
            description: "Cuentas Gmail del workspace",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: { type: "array", items: { $ref: "#/components/schemas/GmailAccount" } },
                  },
                },
              },
            },
          },
          "401": unauthorizedResponse,
          "429": rateLimitResponse,
        },
      },
    },
    "/gmail/oauth/start": {
      post: {
        summary: "Iniciar OAuth Gmail",
        responses: {
          "201": { description: "URL OAuth generada", content: { "application/json": { schema: { type: "object", properties: { data: { $ref: "#/components/schemas/OAuthStartResponse" } } } } } },
          "401": unauthorizedResponse,
          "403": forbiddenResponse,
          "429": rateLimitResponse,
        },
      },
    },
    "/gmail/oauth/status": {
      get: {
        summary: "Consultar estado OAuth Gmail",
        parameters: [
          { name: "status", in: "query", schema: { type: "string" } },
          { name: "error", in: "query", schema: { type: "string" } },
        ],
        responses: {
          "200": { description: "Estado OAuth", content: { "application/json": { schema: { type: "object", additionalProperties: true } } } },
          "401": unauthorizedResponse,
        },
      },
    },
    "/gmail/oauth/callback": {
      get: {
        security: [],
        summary: "Callback OAuth Gmail",
        description:
          "Intercambia code por tokens, guarda credenciales cifradas, crea o actualiza cuenta Gmail y sincroniza mensajes recientes.",
        parameters: [
          { name: "code", in: "query", schema: { type: "string" } },
          { name: "state", in: "query", schema: { type: "string" } },
          { name: "error", in: "query", schema: { type: "string" } },
        ],
        responses: {
          "302": { description: "Redireccion al frontend con resultado OAuth" },
        },
      },
    },
    "/gmail/accounts/{id}/sync": {
      post: {
        summary: "Sincronizar Gmail manualmente",
        parameters: [idPathParameter],
        responses: {
          "200": { description: "Cuenta sincronizada", content: { "application/json": { schema: { type: "object", properties: { data: { $ref: "#/components/schemas/GmailAccount" } } } } } },
          "401": unauthorizedResponse,
          "403": forbiddenResponse,
          "404": notFoundResponse,
          "429": rateLimitResponse,
        },
      },
    },
    "/gmail/accounts/{id}/sync-logs": {
      get: {
        summary: "Listar logs de sincronizacion Gmail",
        parameters: [
          idPathParameter,
          ...paginationParameters,
          { name: "status", in: "query", schema: { type: "string", enum: ["RUNNING", "COMPLETED", "FAILED", "SKIPPED"] } },
        ],
        responses: {
          "200": {
            description: "Logs de sincronizacion paginados",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: { type: "array", items: { $ref: "#/components/schemas/GmailSyncLog" } },
                    pagination: { $ref: "#/components/schemas/Pagination" },
                  },
                },
              },
            },
          },
          "401": unauthorizedResponse,
          "404": notFoundResponse,
          "429": rateLimitResponse,
        },
      },
    },
    "/gmail/accounts/{id}/sync-logs/{logId}": {
      get: {
        summary: "Detalle de log de sincronizacion Gmail",
        parameters: [
          idPathParameter,
          { name: "logId", in: "path", required: true, schema: { type: "string" } },
        ],
        responses: {
          "200": { description: "Log de sincronizacion", content: { "application/json": { schema: { type: "object", properties: { data: { $ref: "#/components/schemas/GmailSyncLog" } } } } } },
          "401": unauthorizedResponse,
          "404": notFoundResponse,
          "429": rateLimitResponse,
        },
      },
    },
    "/gmail/accounts/{id}/reconnect": {
      post: {
        summary: "Reconectar Gmail",
        parameters: [idPathParameter],
        responses: {
          "200": { description: "URL de reconexion", content: { "application/json": { schema: { type: "object", properties: { data: { $ref: "#/components/schemas/OAuthStartResponse" } } } } } },
          "401": unauthorizedResponse,
          "403": forbiddenResponse,
          "404": notFoundResponse,
        },
      },
    },
    "/gmail/accounts/{id}": {
      delete: {
        summary: "Desconectar Gmail",
        parameters: [idPathParameter],
        responses: {
          "200": { description: "Cuenta desconectada", content: { "application/json": { schema: { type: "object", properties: { data: { $ref: "#/components/schemas/GmailAccount" } } } } } },
          "401": unauthorizedResponse,
          "403": forbiddenResponse,
          "404": notFoundResponse,
        },
      },
    },
    "/emails": {
      get: {
        summary: "Bandeja unificada",
        parameters: [
          ...paginationParameters,
          { name: "search", in: "query", schema: { type: "string" } },
          { name: "gmailAccountId", in: "query", schema: { type: "string" } },
          { name: "fromEmail", in: "query", schema: { type: "string" } },
          { name: "fromDomain", in: "query", schema: { type: "string" } },
          { name: "category", in: "query", schema: { type: "string" } },
          { name: "isImportant", in: "query", schema: { type: "boolean" } },
          { name: "isSpam", in: "query", schema: { type: "boolean" } },
          { name: "actionRequired", in: "query", schema: { type: "boolean" } },
          { name: "hasAttachments", in: "query", schema: { type: "boolean" } },
          { name: "isRead", in: "query", schema: { type: "boolean" } },
          { name: "minImportanceScore", in: "query", schema: { type: "number" } },
          { name: "minRiskScore", in: "query", schema: { type: "number" } },
          { name: "minSecurityScore", in: "query", schema: { type: "number" } },
          { name: "dateFrom", in: "query", schema: { type: "string", format: "date-time" } },
          { name: "dateTo", in: "query", schema: { type: "string", format: "date-time" } },
          { name: "sortBy", in: "query", schema: { type: "string", enum: ["receivedAt", "importanceScore", "riskScore", "securityScore"] } },
          { name: "sortOrder", in: "query", schema: { type: "string", enum: ["asc", "desc"] } },
        ],
        responses: {
          "200": {
            description: "Correos paginados",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: { type: "array", items: { $ref: "#/components/schemas/EmailMessage" } },
                    pagination: { $ref: "#/components/schemas/Pagination" },
                  },
                },
              },
            },
          },
          "401": unauthorizedResponse,
        },
      },
    },
    "/emails/{id}": {
      get: {
        summary: "Detalle de correo",
        parameters: [idPathParameter],
        responses: {
          "200": { description: "Correo", content: { "application/json": { schema: { type: "object", properties: { data: { $ref: "#/components/schemas/EmailMessage" } } } } } },
          "401": unauthorizedResponse,
          "404": notFoundResponse,
        },
      },
    },
    "/emails/{id}/classification": {
      patch: {
        summary: "Corregir clasificacion",
        parameters: [idPathParameter],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["primaryCategory"],
                properties: {
                  primaryCategory: { type: "string" },
                  secondaryCategories: { type: "array", items: { type: "string" } },
                  importanceScore: { type: "number", minimum: 0, maximum: 100 },
                  spamScore: { type: "number", minimum: 0, maximum: 100 },
                  riskScore: { type: "number", minimum: 0, maximum: 100 },
                  securityScore: { type: "number", minimum: 0, maximum: 100 },
                  actionRequired: { type: "boolean" },
                  explanation: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "Clasificacion corregida", content: { "application/json": { schema: { type: "object", properties: { data: { $ref: "#/components/schemas/EmailMessage" } } } } } },
          "400": validationErrorResponse,
          "401": unauthorizedResponse,
          "404": notFoundResponse,
        },
      },
    },
    "/emails/{id}/mark-reviewed": {
      post: { summary: "Marcar correo revisado", parameters: [idPathParameter], responses: { "200": { description: "Correo actualizado" }, "401": unauthorizedResponse, "404": notFoundResponse } },
    },
    "/emails/{id}/mark-important": {
      post: { summary: "Marcar correo importante", parameters: [idPathParameter], responses: { "200": { description: "Correo actualizado" }, "401": unauthorizedResponse, "404": notFoundResponse } },
    },
    "/alerts": {
      get: {
        summary: "Listar alertas",
        parameters: paginationParameters,
        responses: {
          "200": { description: "Alertas paginadas", content: { "application/json": { schema: { type: "object", properties: { data: { type: "array", items: { $ref: "#/components/schemas/Alert" } }, pagination: { $ref: "#/components/schemas/Pagination" } } } } } },
          "401": unauthorizedResponse,
        },
      },
    },
    "/alerts/{id}": { get: { summary: "Detalle de alerta", parameters: [idPathParameter], responses: { "200": { description: "Alerta" }, "401": unauthorizedResponse, "404": notFoundResponse } } },
    "/alerts/{id}/resolve": { post: { summary: "Resolver alerta", parameters: [idPathParameter], responses: { "200": { description: "Alerta resuelta" }, "401": unauthorizedResponse, "404": notFoundResponse } } },
    "/alerts/{id}/ignore": { post: { summary: "Ignorar alerta", parameters: [idPathParameter], responses: { "200": { description: "Alerta ignorada" }, "401": unauthorizedResponse, "404": notFoundResponse } } },
    "/senders": { get: { summary: "Listar remitentes", parameters: paginationParameters, responses: { "200": { description: "Remitentes paginados" }, "401": unauthorizedResponse } } },
    "/senders/{id}": { get: { summary: "Detalle de remitente", parameters: [idPathParameter], responses: { "200": { description: "Remitente" }, "401": unauthorizedResponse, "404": notFoundResponse } } },
    "/senders/{id}/trust": { post: { summary: "Marcar remitente confiable", parameters: [idPathParameter], responses: { "200": { description: "Remitente actualizado" }, "401": unauthorizedResponse, "404": notFoundResponse } } },
    "/senders/{id}/suspicious": { post: { summary: "Marcar remitente sospechoso", parameters: [idPathParameter], responses: { "200": { description: "Remitente actualizado" }, "401": unauthorizedResponse, "404": notFoundResponse } } },
    "/senders/{id}/emails": { get: { summary: "Correos de remitente", parameters: [idPathParameter, ...paginationParameters], responses: { "200": { description: "Correos del remitente" }, "401": unauthorizedResponse, "404": notFoundResponse } } },
    "/rules": {
      get: { summary: "Listar reglas", parameters: paginationParameters, responses: { "200": { description: "Reglas paginadas" }, "401": unauthorizedResponse } },
      post: { summary: "Crear regla", responses: { "201": { description: "Regla creada" }, "400": validationErrorResponse, "401": unauthorizedResponse, "403": forbiddenResponse } },
    },
    "/rules/{id}": {
      get: { summary: "Detalle de regla", parameters: [idPathParameter], responses: { "200": { description: "Regla" }, "401": unauthorizedResponse, "404": notFoundResponse } },
      patch: { summary: "Actualizar regla", parameters: [idPathParameter], responses: { "200": { description: "Regla actualizada" }, "400": validationErrorResponse, "401": unauthorizedResponse, "403": forbiddenResponse, "404": notFoundResponse } },
      delete: { summary: "Eliminar regla", parameters: [idPathParameter], responses: { "200": { description: "Regla eliminada" }, "401": unauthorizedResponse, "403": forbiddenResponse, "404": notFoundResponse } },
    },
    "/rules/{id}/enable": { post: { summary: "Activar regla", parameters: [idPathParameter], responses: { "200": { description: "Regla activada" }, "401": unauthorizedResponse, "403": forbiddenResponse, "404": notFoundResponse } } },
    "/rules/{id}/disable": { post: { summary: "Desactivar regla", parameters: [idPathParameter], responses: { "200": { description: "Regla desactivada" }, "401": unauthorizedResponse, "403": forbiddenResponse, "404": notFoundResponse } } },
    "/analytics/summary": { get: { summary: "Resumen analitico", responses: { "200": { description: "Resumen" }, "401": unauthorizedResponse } } },
    "/analytics/emails-by-day": { get: { summary: "Correos por dia", responses: { "200": { description: "Serie temporal" }, "401": unauthorizedResponse } } },
    "/analytics/categories": { get: { summary: "Distribucion por categoria", responses: { "200": { description: "Categorias" }, "401": unauthorizedResponse } } },
    "/analytics/top-senders": { get: { summary: "Top remitentes", responses: { "200": { description: "Top remitentes" }, "401": unauthorizedResponse } } },
    "/analytics/accounts": { get: { summary: "Analitica por cuenta Gmail", responses: { "200": { description: "Analitica por cuenta" }, "401": unauthorizedResponse } } },
    "/audit": { get: { summary: "Auditoria", parameters: [...paginationParameters, { name: "action", in: "query", schema: { type: "string" } }, { name: "userId", in: "query", schema: { type: "string" } }, { name: "dateFrom", in: "query", schema: { type: "string", format: "date-time" } }, { name: "dateTo", in: "query", schema: { type: "string", format: "date-time" } }], responses: { "200": { description: "Auditoria paginada" }, "401": unauthorizedResponse } } },
    "/settings": {
      get: { summary: "Obtener configuracion", responses: { "200": { description: "Settings", content: { "application/json": { schema: { type: "object", properties: { data: { $ref: "#/components/schemas/WorkspaceSettings" } } } } } }, "401": unauthorizedResponse } },
      patch: { summary: "Actualizar configuracion", responses: { "200": { description: "Settings actualizados" }, "400": validationErrorResponse, "401": unauthorizedResponse, "403": forbiddenResponse } },
    },
  },
} as const;
