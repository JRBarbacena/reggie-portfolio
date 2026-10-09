export class ApiRequestError extends Error {
  constructor(message, status = 0) {
    super(message);
    this.name = "ApiRequestError";
    this.status = status;
  }
}

export async function requestJson(url, options = {}, { timeoutMs = 8_000, fallbackMessage = "The request could not be completed." } = {}) {
  const timeoutSignal = AbortSignal.timeout(timeoutMs);
  const signal = options.signal ? AbortSignal.any([options.signal, timeoutSignal]) : timeoutSignal;

  try {
    const response = await fetch(url, { ...options, signal });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new ApiRequestError(result.message || fallbackMessage, response.status);
    return result;
  } catch (error) {
    if (error?.name === "TimeoutError") throw new ApiRequestError("The request timed out. Please try again.");
    throw error;
  }
}
