export class EmptyJsonResponseError extends Error {
  constructor(
    readonly url: string,
    readonly status: number,
  ) {
    super(`Empty JSON response (${status}) from ${url}`);
    this.name = "EmptyJsonResponseError";
  }
}

export class InvalidJsonResponseError extends Error {
  constructor(
    readonly url: string,
    readonly status: number,
    readonly snippet: string,
  ) {
    super(`Invalid JSON response (${status}) from ${url}`);
    this.name = "InvalidJsonResponseError";
  }
}

/**
 * Reads a fetch Response body safely. Avoids `response.json()` on empty bodies,
 * which throws `SyntaxError: Unexpected end of JSON input`.
 */
export async function parseJsonResponse<T>(response: Response): Promise<T> {
  const url = response.url || "unknown";
  const text = await response.text();

  if (!text.trim()) {
    throw new EmptyJsonResponseError(url, response.status);
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    throw new InvalidJsonResponseError(
      url,
      response.status,
      text.slice(0, 120),
    );
  }
}

/**
 * Best-effort JSON parse for polling endpoints. Returns null on empty/invalid body
 * instead of throwing, so transient dev-server responses do not fail the workflow.
 */
export async function parseJsonResponseSafe<T>(response: Response): Promise<T | null> {
  try {
    return await parseJsonResponse<T>(response);
  } catch {
    return null;
  }
}
