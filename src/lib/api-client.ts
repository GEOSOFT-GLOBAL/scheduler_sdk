import type { TimetableApiConfig } from "../types/config";

/**
 * Transport for the Timetablely API.
 *
 * The service the app talks to is the same one reached here, on the same
 * routes, returning the same records. The only difference is the credential:
 * the app carries a signed-in user's bearer token, an SDK integration carries
 * an API key pair. Both resolve to one user's data on the server, so an
 * embedded grid shows what its owner sees in the app rather than a copy that
 * drifts.
 */

/** Where the hosted service lives. Override via `apiUrl` for self-hosting. */
export const DEFAULT_API_URL = "https://geosoft-service.onrender.com/api/v1";

/** Timetable records sit under this namespace on the service. */
export const TIMETABLE_PATH = "/timetablely/sync";

/** Every response the service sends is wrapped in this. */
export interface ApiEnvelope<T> {
    status: number;
    success: boolean;
    message: string;
    data: T;
}

/**
 * A failed API call.
 *
 * `status` and `code` are carried rather than folded into the message because
 * callers act on them — 401 means the key is wrong and retrying will not help,
 * `API_KEY_SCOPE_REQUIRED` means the key is fine but read-only.
 */
export class TimetablelyApiError extends Error {
    constructor(
        message: string,
        readonly status: number,
        readonly code?: string,
    ) {
        super(message);
        this.name = "TimetablelyApiError";
    }
}

export interface ApiRequestOptions {
    /** Aborts the request; the provider passes one so unmount cancels in-flight loads. */
    signal?: AbortSignal;
    query?: Record<string, string | number | undefined>;
}

const buildUrl = (
    base: string,
    path: string,
    query?: ApiRequestOptions["query"],
): string => {
    const url = `${base.replace(/\/$/, "")}${path}`;
    if (!query) return url;

    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(query)) {
        if (value !== undefined) params.set(key, String(value));
    }

    const search = params.toString();
    return search ? `${url}?${search}` : url;
};

/**
 * Turns whatever came back into an error worth showing.
 *
 * A service error arrives as JSON with a message written for a human; a
 * gateway or proxy failure arrives as HTML with none. Falling back to the
 * status text keeps the second case from surfacing as "undefined".
 */
const errorFrom = async (response: Response): Promise<TimetablelyApiError> => {
    try {
        const body = (await response.json()) as Partial<ApiEnvelope<unknown>> & {
            code?: string;
        };
        return new TimetablelyApiError(
            body.message || response.statusText || "Request failed",
            response.status,
            body.code,
        );
    } catch {
        return new TimetablelyApiError(
            response.statusText || "Request failed",
            response.status,
        );
    }
};

export interface TimetablelyApiClient {
    get<T>(path: string, options?: ApiRequestOptions): Promise<T>;
    post<T>(path: string, body: unknown, options?: ApiRequestOptions): Promise<T>;
    remove<T>(path: string, options?: ApiRequestOptions): Promise<T>;
}

/**
 * Builds a client bound to one set of credentials.
 *
 * `fetchImpl` exists so tests and non-browser hosts can supply their own; it
 * defaults to the global.
 */
export const createApiClient = (
    config: TimetableApiConfig,
): TimetablelyApiClient => {
    const base = `${config.apiUrl || DEFAULT_API_URL}${TIMETABLE_PATH}`;
    const doFetch = config.fetchImpl || ((...args: Parameters<typeof fetch>) => fetch(...args));

    const headers = (): HeadersInit => ({
        "Content-Type": "application/json",
        "X-API-Key": config.apiKey,
        "X-API-Secret": config.apiSecret,
        // The service scopes a key to the app that issued it; this is how it
        // knows which one is calling.
        "X-App-Source": "timetablely",
    });

    const request = async <T>(
        path: string,
        init: RequestInit,
        options?: ApiRequestOptions,
    ): Promise<T> => {
        const response = await doFetch(buildUrl(base, path, options?.query), {
            ...init,
            headers: headers(),
            signal: options?.signal,
        });

        if (!response.ok) throw await errorFrom(response);

        const envelope = (await response.json()) as ApiEnvelope<T>;

        // A 200 carrying `success: false` is the service reporting a handled
        // failure. Treating it as success would hand callers an empty payload
        // and no reason why.
        if (!envelope.success) {
            throw new TimetablelyApiError(
                envelope.message || "Request failed",
                response.status,
            );
        }

        return envelope.data;
    };

    return {
        get: (path, options) => request(path, { method: "GET" }, options),
        post: (path, body, options) =>
            request(path, { method: "POST", body: JSON.stringify(body) }, options),
        remove: (path, options) => request(path, { method: "DELETE" }, options),
    };
};
