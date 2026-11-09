import { encodeBase64 } from "../utils/base64";
import { normalizeStudentRecord } from "../utils/studentRecord";
import { parseStudentHtml } from "../utils/studentHtml";

const REQUEST_TIMEOUT_MS = 15000;
const CONFIGURED_API_BASE_URL = (
  process.env.EXPO_PUBLIC_API_BASE_URL || ""
).trim();

export const isApiConfigured = CONFIGURED_API_BASE_URL.length > 0;

export class StudentApiError extends Error {
  constructor({
    code = "unknown",
    title = "Something went wrong",
    message = "An unexpected error occurred.",
    detail = "",
    status = null,
  }) {
    super(message);
    this.name = "StudentApiError";
    this.code = code;
    this.title = title;
    this.detail = detail;
    this.status = status;
  }
}

function createConfigurationError() {
  return new StudentApiError({
    code: "config",
    title: "API endpoint not configured",
    message:
      "Add EXPO_PUBLIC_API_BASE_URL to your .env file to connect the app.",
    detail:
      "Use the API origin or the full student endpoint, then restart Expo.",
  });
}

function createNotFoundError() {
  return new StudentApiError({
    code: "not_found",
    title: "Registration number not found",
    message: "We could not find a student record for this registration number.",
    detail: "Check the number for typos and try again.",
    status: 404,
  });
}

function createAbortError() {
  return new StudentApiError({
    code: "aborted",
    title: "Search cancelled",
    message: "The search was cancelled.",
  });
}

function createInvalidResponseError() {
  return new StudentApiError({
    code: "invalid_response",
    title: "Unexpected response",
    message: "The server returned data the app could not read.",
    detail:
      "Check that the student endpoint still returns the student details page or a JSON student record.",
  });
}

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function getServerMessage(payload) {
  if (!isObject(payload)) {
    return "";
  }

  const candidates = [
    payload.message,
    payload.error,
    payload.detail,
    payload.description,
  ];

  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim()) {
      return candidate
        .replace(/<[^>]*>/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 240);
    }

    if (isObject(candidate) && typeof candidate.message === "string") {
      return candidate.message.trim().slice(0, 240);
    }
  }

  return "";
}

function hasExplicitFailure(payload) {
  if (!isObject(payload)) {
    return false;
  }

  return (
    payload.success === false ||
    payload.ok === false ||
    (payload.error !== undefined &&
      payload.error !== null &&
      payload.error !== false)
  );
}

function getStatusError(status, serverMessage) {
  if (status === 401 || status === 403) {
    return new StudentApiError({
      code: "forbidden",
      title: "Access denied",
      message: "This device is not allowed to view student records.",
      detail: "Contact your administrator if you believe this is a mistake.",
      status,
    });
  }

  if (status === 429) {
    return new StudentApiError({
      code: "rate_limited",
      title: "Too many requests",
      message: "The server is receiving too many lookups right now.",
      detail: "Wait a moment, then try again.",
      status,
    });
  }

  if (status >= 500) {
    return new StudentApiError({
      code: "server_error",
      title: "Server error",
      message:
        serverMessage || "The student API could not complete the request.",
      detail: "Please try again in a moment.",
      status,
    });
  }

  if (status === 400) {
    return new StudentApiError({
      code: "invalid_request",
      title: "Registration number rejected",
      message: serverMessage || "The server rejected this registration number.",
      detail: "Check the number and try again.",
      status,
    });
  }

  return new StudentApiError({
    code: "http_error",
    title: "Lookup failed",
    message: serverMessage || "The server returned an unexpected response.",
    detail: `The request failed with HTTP status ${status}.`,
    status,
  });
}

function resolveStudentBaseUrl(value) {
  const baseUrl = String(value ?? "")
    .trim()
    .replace(/\/+$/, "");

  if (!baseUrl) {
    return "";
  }

  if (/\/student-details$/i.test(baseUrl)) {
    return baseUrl;
  }

  return `${baseUrl}/student-details`;
}

export function buildStudentEndpoint(
  registrationNumber,
  configuredBaseUrl = CONFIGURED_API_BASE_URL,
) {
  const baseUrl = resolveStudentBaseUrl(configuredBaseUrl);

  if (!baseUrl) {
    throw createConfigurationError();
  }

  const registration = String(registrationNumber ?? "").trim();

  if (!registration) {
    throw new StudentApiError({
      code: "empty",
      title: "Registration number required",
      message: "Enter a registration number before searching.",
      detail: "For example, REG-12345.",
    });
  }

  const encodedRegistration = encodeBase64(registration);
  const encodedPathSegment = encodeURIComponent(encodedRegistration);

  return {
    url: `${baseUrl}/${encodedPathSegment}`,
    encodedRegistration,
  };
}

export async function fetchStudentDetails(
  registrationNumber,
  { signal, timeoutMs = REQUEST_TIMEOUT_MS } = {},
) {
  const { url, encodedRegistration } = buildStudentEndpoint(registrationNumber);
  const registration = String(registrationNumber).trim();
  const controller = new AbortController();
  let timedOut = false;

  const handleExternalAbort = () => {
    controller.abort();
  };

  if (signal) {
    if (signal.aborted) {
      throw createAbortError();
    }

    signal.addEventListener("abort", handleExternalAbort);
  }

  const timeoutId = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "text/html,application/xhtml+xml,application/json;q=0.9",
      },
      signal: controller.signal,
    });

    const rawBody = await response.text();
    const trimmedBody = rawBody.trim();
    const contentType = (
      response.headers.get("content-type") || ""
    ).toLowerCase();
    const looksLikeJson = /^[\[{]/.test(trimmedBody);
    const looksLikeHtml =
      contentType.includes("html") ||
      /^(<!doctype\s+html|<html\b)/i.test(trimmedBody) ||
      trimmedBody.includes("Student Profile Header");
    let payload = null;

    if (trimmedBody && (looksLikeJson || contentType.includes("json"))) {
      try {
        payload = JSON.parse(trimmedBody);
      } catch {
        payload = null;
      }
    }

    if (!response.ok) {
      if (response.status === 404) {
        throw createNotFoundError();
      }

      const serverMessage = getServerMessage(payload);
      throw getStatusError(response.status, serverMessage);
    }

    if (payload === null && looksLikeHtml) {
      const student = parseStudentHtml(rawBody, registration);

      if (!student) {
        throw createInvalidResponseError();
      }

      return {
        student,
        encodedRegistration,
      };
    }

    if (payload === null || typeof payload !== "object") {
      throw createInvalidResponseError();
    }

    if (hasExplicitFailure(payload)) {
      const serverMessage = getServerMessage(payload);

      if (
        /not found|no record|no student|does not exist/i.test(serverMessage)
      ) {
        throw createNotFoundError();
      }

      throw new StudentApiError({
        code: "api_failure",
        title: "Lookup failed",
        message: serverMessage || "The server could not complete this lookup.",
        detail: "Double-check the registration number and try again.",
      });
    }

    const student = normalizeStudentRecord(payload, registration);

    if (!student) {
      throw createInvalidResponseError();
    }

    return {
      student,
      encodedRegistration,
    };
  } catch (error) {
    if (error instanceof StudentApiError) {
      throw error;
    }

    if (timedOut) {
      throw new StudentApiError({
        code: "timeout",
        title: "Request timed out",
        message: "The student API took too long to respond.",
        detail: "Please try again in a moment.",
      });
    }

    if (controller.signal.aborted) {
      throw createAbortError();
    }

    throw new StudentApiError({
      code: "network",
      title: "Connection problem",
      message: "The app could not reach the student API.",
      detail: "Check your internet connection and API URL, then try again.",
    });
  } finally {
    clearTimeout(timeoutId);

    if (signal) {
      signal.removeEventListener("abort", handleExternalAbort);
    }
  }
}
