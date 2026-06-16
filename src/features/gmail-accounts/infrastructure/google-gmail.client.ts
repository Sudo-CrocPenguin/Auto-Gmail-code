import type { Credentials } from "google-auth-library";
import { google, type gmail_v1 } from "googleapis";

import { environment } from "../../../shared/config/environment";
import { AppError } from "../../../shared/domain/errors/app-error";

export interface GmailProfile {
  emailAddress: string;
  messagesTotal: number;
  threadsTotal: number;
  historyId: string | null;
}

export interface SyncedGmailAttachment {
  id: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
}

export interface SyncedGmailMessage {
  gmailMessageId: string;
  threadId: string;
  snippet: string;
  receivedAt: string;
  labelIds: string[];
  headers: Record<string, string>;
  bodyHtml: string | null;
  bodyText: string | null;
  attachments: SyncedGmailAttachment[];
}

export class GoogleGmailClient {
  public buildAuthUrl(state: string): string {
    return this.createOAuthClient().generateAuthUrl({
      access_type: "offline",
      prompt: "consent",
      scope: environment.google.scopes,
      state,
    });
  }

  public async exchangeCode(code: string): Promise<Credentials> {
    const oauthClient = this.createOAuthClient();
    const { tokens } = await oauthClient.getToken(code);
    return tokens;
  }

  public async revokeCredentials(credentials: Credentials): Promise<"revoked" | "skipped"> {
    const token = credentials.refresh_token ?? credentials.access_token;
    if (!token) {
      return "skipped";
    }

    await this.createOAuthClient().revokeToken(token);
    return "revoked";
  }

  public async fetchAttachment(
    credentials: Credentials,
    messageId: string,
    attachmentId: string,
  ): Promise<Buffer> {
    const gmail = this.createGmailClient(credentials);
    const response = await gmail.users.messages.attachments.get({
      userId: "me",
      messageId,
      id: attachmentId,
    });
    const data = response.data.data;

    if (!data) {
      throw new AppError("Gmail no devolvio contenido del adjunto.", 502, "GMAIL_ATTACHMENT_EMPTY");
    }

    return Buffer.from(data.replaceAll("-", "+").replaceAll("_", "/"), "base64");
  }

  public async getProfile(credentials: Credentials): Promise<GmailProfile> {
    const gmail = this.createGmailClient(credentials);
    const response = await gmail.users.getProfile({ userId: "me" });
    const emailAddress = response.data.emailAddress;

    if (!emailAddress) {
      throw new AppError("Google no devolvio el email de la cuenta Gmail.", 502, "GMAIL_PROFILE_ERROR");
    }

    return {
      emailAddress,
      messagesTotal: response.data.messagesTotal ?? 0,
      threadsTotal: response.data.threadsTotal ?? 0,
      historyId: response.data.historyId ?? null,
    };
  }

  public async fetchMessagesSinceHistoryId(
    credentials: Credentials,
    historyId: string,
    maxResults = environment.google.syncMaxMessages,
  ): Promise<SyncedGmailMessage[]> {
    const gmail = this.createGmailClient(credentials);
    const messageIds = new Set<string>();
    let pageToken: string | undefined;

    do {
      const params: gmail_v1.Params$Resource$Users$History$List = {
        userId: "me",
        startHistoryId: historyId,
        historyTypes: ["messageAdded"],
        maxResults: resolvePageSize(maxResults - messageIds.size),
      };

      if (pageToken) {
        params.pageToken = pageToken;
      }

      const historyResponse = await gmail.users.history.list(params);

      for (const history of historyResponse.data.history ?? []) {
        for (const addedMessage of history.messagesAdded ?? []) {
          if (addedMessage.message?.id) {
            messageIds.add(addedMessage.message.id);
          }
        }
      }

      pageToken = historyResponse.data.nextPageToken ?? undefined;
    } while (pageToken && messageIds.size < maxResults);

    return fetchFullMessages(gmail, Array.from(messageIds).slice(0, maxResults));
  }

  public async fetchRecentMessages(
    credentials: Credentials,
    maxResults = environment.google.syncMaxMessages,
  ): Promise<SyncedGmailMessage[]> {
    const gmail = this.createGmailClient(credentials);
    const messageIds: string[] = [];
    let pageToken: string | undefined;

    do {
      const params: gmail_v1.Params$Resource$Users$Messages$List = {
        userId: "me",
        maxResults: resolvePageSize(maxResults - messageIds.length),
        includeSpamTrash: false,
      };

      if (pageToken) {
        params.pageToken = pageToken;
      }

      const listResponse = await gmail.users.messages.list(params);

      for (const messageRef of listResponse.data.messages ?? []) {
        if (!messageRef.id || messageIds.length >= maxResults) {
          continue;
        }

        messageIds.push(messageRef.id);
      }

      pageToken = listResponse.data.nextPageToken ?? undefined;
    } while (pageToken && messageIds.length < maxResults);

    return fetchFullMessages(gmail, messageIds);
  }

  private createGmailClient(credentials: Credentials): gmail_v1.Gmail {
    const oauthClient = this.createOAuthClient();
    oauthClient.setCredentials(credentials);
    return google.gmail({ version: "v1", auth: oauthClient });
  }

  private createOAuthClient() {
    if (!environment.google.clientId || !environment.google.clientSecret) {
      throw new AppError(
        "Google OAuth no esta configurado. Define GOOGLE_CLIENT_ID y GOOGLE_CLIENT_SECRET.",
        503,
        "GOOGLE_OAUTH_NOT_CONFIGURED",
      );
    }

    return new google.auth.OAuth2(
      environment.google.clientId,
      environment.google.clientSecret,
      environment.google.redirectUri,
    );
  }
}

async function fetchFullMessages(
  gmail: gmail_v1.Gmail,
  messageIds: string[],
): Promise<SyncedGmailMessage[]> {
  const messages: SyncedGmailMessage[] = [];

  for (const messageId of messageIds) {
    const messageResponse = await gmail.users.messages.get({
      userId: "me",
      id: messageId,
      format: "full",
    });

    messages.push(mapGmailMessage(messageResponse.data));
  }

  return messages;
}

function resolvePageSize(remaining: number): number {
  return Math.max(1, Math.min(remaining, 100));
}

function mapGmailMessage(message: gmail_v1.Schema$Message): SyncedGmailMessage {
  const payload = message.payload;
  const headers = mapHeaders(payload?.headers ?? []);
  const body = extractBody(payload);
  const attachments = extractAttachments(payload);

  return {
    gmailMessageId: requireValue(message.id, "Gmail message id"),
    threadId: message.threadId ?? requireValue(message.id, "Gmail thread id"),
    snippet: message.snippet ?? "",
    receivedAt: resolveReceivedAt(message, headers),
    labelIds: message.labelIds ?? [],
    headers,
    bodyHtml: body.html,
    bodyText: body.text,
    attachments,
  };
}

function mapHeaders(headers: gmail_v1.Schema$MessagePartHeader[]): Record<string, string> {
  return headers.reduce<Record<string, string>>((accumulator, header) => {
    if (header.name && header.value) {
      accumulator[header.name.toLowerCase()] = header.value;
    }
    return accumulator;
  }, {});
}

function extractBody(payload: gmail_v1.Schema$MessagePart | undefined): {
  html: string | null;
  text: string | null;
} {
  if (!payload) {
    return { html: null, text: null };
  }

  const html = findBodyPart(payload, "text/html");
  const text = findBodyPart(payload, "text/plain");

  return {
    html,
    text,
  };
}

function findBodyPart(part: gmail_v1.Schema$MessagePart, mimeType: string): string | null {
  if (part.mimeType === mimeType && part.body?.data) {
    return decodeBase64Url(part.body.data);
  }

  for (const childPart of part.parts ?? []) {
    const body = findBodyPart(childPart, mimeType);
    if (body) {
      return body;
    }
  }

  return null;
}

function extractAttachments(
  payload: gmail_v1.Schema$MessagePart | undefined,
): SyncedGmailAttachment[] {
  if (!payload) {
    return [];
  }

  const attachments: SyncedGmailAttachment[] = [];
  collectAttachments(payload, attachments);
  return attachments;
}

function collectAttachments(
  part: gmail_v1.Schema$MessagePart,
  attachments: SyncedGmailAttachment[],
): void {
  if (part.filename && part.body?.attachmentId) {
    attachments.push({
      id: part.body.attachmentId,
      filename: part.filename,
      mimeType: part.mimeType ?? "application/octet-stream",
      sizeBytes: part.body.size ?? 0,
    });
  }

  for (const childPart of part.parts ?? []) {
    collectAttachments(childPart, attachments);
  }
}

function decodeBase64Url(value: string): string {
  return Buffer.from(value.replaceAll("-", "+").replaceAll("_", "/"), "base64").toString("utf8");
}

function resolveReceivedAt(
  message: gmail_v1.Schema$Message,
  headers: Record<string, string>,
): string {
  if (message.internalDate) {
    return new Date(Number(message.internalDate)).toISOString();
  }

  const dateHeader = headers.date;
  if (dateHeader && !Number.isNaN(new Date(dateHeader).getTime())) {
    return new Date(dateHeader).toISOString();
  }

  return new Date().toISOString();
}

function requireValue(value: string | null | undefined, label: string): string {
  if (!value) {
    throw new AppError(`${label} no esta disponible en Gmail API.`, 502, "GMAIL_MESSAGE_ERROR");
  }

  return value;
}
