export type JsonRecord = Record<string, unknown>;

const TOKEN_KEY = "lunetty.access-token";
const UNAUTHORIZED_EVENT = "lunetty:unauthorized";

export class ApiError extends Error {
  status: number;
  details: unknown;

  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.sessionStorage.getItem(TOKEN_KEY);
}

export function setAccessToken(token: string): void {
  window.sessionStorage.setItem(TOKEN_KEY, token);
}

export function clearAccessToken(): void {
  if (typeof window !== "undefined") {
    window.sessionStorage.removeItem(TOKEN_KEY);
  }
}

export function apiUrl(path: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? "/api/v1";
  return `${baseUrl.replace(/\/+$/, "")}/${path.replace(/^\/+/, "")}`;
}

export async function apiRequest<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const headers = new Headers(init.headers);
  const token = getAccessToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (
    init.body &&
    !(typeof FormData !== "undefined" && init.body instanceof FormData) &&
    !headers.has("Content-Type")
  ) {
    headers.set("Content-Type", "application/json");
  }

  let response: Response;
  try {
    response = await fetch(apiUrl(path), {
      ...init,
      headers,
      cache: "no-store",
    });
  } catch {
    throw new ApiError(
      0,
      `Impossible de joindre l’API à ${apiUrl(path)}. Vérifiez que le backend est bien démarré et que LUNETTY_API_PROXY_TARGET pointe vers le bon service.`,
    );
  }
  const contentType = response.headers.get("content-type") ?? "";
  const payload: unknown = contentType.includes("application/json")
    ? await response.json().catch(() => undefined)
    : await response.text().catch(() => "");

  if (!response.ok) {
    const message = extractMessage(payload) ?? `La requête a échoué (${response.status})`;
    if (response.status === 401 && token) {
      clearAccessToken();
      window.dispatchEvent(new Event(UNAUTHORIZED_EVENT));
    }
    throw new ApiError(response.status, message, payload);
  }

  return payload as T;
}

export function onUnauthorized(callback: () => void): () => void {
  window.addEventListener(UNAUTHORIZED_EVENT, callback);
  return () => window.removeEventListener(UNAUTHORIZED_EVENT, callback);
}

export function queryString(values: Record<string, string | number | undefined>): string {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(values)) {
    if (value !== undefined && String(value).trim() !== "") {
      query.set(key, String(value));
    }
  }
  const encoded = query.toString();
  return encoded ? `?${encoded}` : "";
}

function extractMessage(payload: unknown): string | undefined {
  if (typeof payload === "string" && payload) return translateApiMessage(payload);
  if (!payload || typeof payload !== "object") return undefined;
  const record = payload as { message?: unknown; error?: unknown };
  if (Array.isArray(record.message)) return record.message.map((value) => translateApiMessage(String(value))).join("; ");
  if (typeof record.message === "string") return translateApiMessage(record.message);
  if (typeof record.error === "string") return translateApiMessage(record.error);
  return undefined;
}

function translateApiMessage(message: string): string {
  const lower = message.trim();
  if (!lower) return message;

  const replacements: Array<[RegExp, string]> = [
    [/Invalid credentials?/gi, "Identifiants invalides"],
    [/Authentication failed/gi, "Authentification échouée"],
    [/Unauthorized/gi, "Non autorisé"],
    [/Forbidden/gi, "Accès refusé"],
    [/User not found/gi, "Utilisateur introuvable"],
    [/Email already exists/gi, "Un compte avec cet e-mail existe déjà"],
    [/Email is invalid/gi, "L’e-mail est invalide"],
    [/Password.*(too short|must be at least)/gi, "Le mot de passe est trop court"],
    [/This field is required/gi, "Ce champ est obligatoire"],
    [/Validation failed/gi, "La validation a échoué"],
    [/Request failed/gi, "La requête a échoué"],
    [/Could not connect to the API/gi, "Impossible de joindre l’API"],
    [/Not found/gi, "Introuvable"],
    [/Bad request/gi, "Requête invalide"],
  ];

  let translated = message;
  for (const [pattern, replacement] of replacements) {
    translated = translated.replace(pattern, replacement);
  }
  return translated;
}
