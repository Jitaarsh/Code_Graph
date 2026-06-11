/**
 * Integration Helpers
 * Utility functions for importing customers from external REST APIs.
 */

// ── 1. Validate Integration Config ────────────────────────────────
export const validateIntegrationConfig = (body) => {
  const {
    apiUrl,
    authType = "none",
    authToken = "",
    method = "GET",
    dataPath = "",
    fieldMapping = {},
    defaults = {},
  } = body;

  if (!apiUrl || typeof apiUrl !== "string" || !apiUrl.startsWith("http")) {
    return { error: "A valid API URL starting with http(s) is required." };
  }

  const allowedMethods = ["GET", "POST"];
  if (!allowedMethods.includes(method.toUpperCase())) {
    return { error: `HTTP method must be one of: ${allowedMethods.join(", ")}` };
  }

  const allowedAuthTypes = ["none", "bearer", "apiKey", "basic"];
  if (!allowedAuthTypes.includes(authType)) {
    return { error: `Auth type must be one of: ${allowedAuthTypes.join(", ")}` };
  }

  if (authType !== "none" && !authToken) {
    return { error: "An auth token/key is required for the selected auth type." };
  }

  if (!fieldMapping || typeof fieldMapping !== "object") {
    return { error: "Field mapping must be provided as an object." };
  }

  if (!fieldMapping.name || !fieldMapping.email) {
    return {
      error:
        "Field mapping must include at least 'name' and 'email' mappings.",
    };
  }

  return {
    error: null,
    value: {
      apiUrl: apiUrl.trim(),
      authType,
      authToken,
      method: method.toUpperCase(),
      dataPath: dataPath.trim(),
      fieldMapping,
      defaults: {
        category: defaults.category || "b2b",
        leadType: defaults.leadType || "hot",
        currency: defaults.currency || "inr",
        ...defaults,
      },
    },
  };
};

// ── 2. Fetch External Customers ───────────────────────────────────
export const fetchExternalCustomers = async (config) => {
  const { apiUrl, method, authType, authToken } = config;

  const headers = { "Content-Type": "application/json" };

  switch (authType) {
    case "bearer":
      headers["Authorization"] = `Bearer ${authToken}`;
      break;
    case "apiKey":
      headers["X-API-Key"] = authToken;
      break;
    case "basic":
      headers["Authorization"] = `Basic ${Buffer.from(authToken).toString("base64")}`;
      break;
    default:
      break;
  }

  const fetchOptions = { method, headers };

  const response = await fetch(apiUrl, fetchOptions);

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(
      `External API responded with status ${response.status}: ${text.slice(0, 200)}`
    );
  }

  const payload = await response.json();
  return payload;
};

// ── 3. Extract Customer Records ───────────────────────────────────
export const extractCustomerRecords = (payload, dataPath) => {
  if (!dataPath || dataPath.trim() === "") {
    // Root-level array
    if (Array.isArray(payload)) return payload;
    // Try common wrappers
    if (Array.isArray(payload?.data)) return payload.data;
    if (Array.isArray(payload?.results)) return payload.results;
    if (Array.isArray(payload?.records)) return payload.records;
    if (Array.isArray(payload?.items)) return payload.items;
    throw new Error(
      "Could not find an array of records. Please specify a data path."
    );
  }

  // Traverse dot-notated path, e.g. "data.contacts"
  const parts = dataPath.split(".");
  let current = payload;

  for (const part of parts) {
    if (current == null || typeof current !== "object") {
      throw new Error(
        `Data path "${dataPath}" is invalid — could not traverse past "${part}".`
      );
    }
    current = current[part];
  }

  if (!Array.isArray(current)) {
    throw new Error(
      `Data path "${dataPath}" did not resolve to an array. Got ${typeof current}.`
    );
  }

  return current;
};

// ── 4. Build Preview Rows ─────────────────────────────────────────
export const buildPreviewRows = (records, fieldMapping, defaults, ownerName) => {
  const CUSTOMER_FIELDS = [
    "name",
    "businessName",
    "email",
    "contactNo",
    "country",
    "state",
    "city",
    "category",
    "leadType",
    "appointedUser",
    "currency",
  ];

  return records.map((record, index) => {
    const customer = {};
    const errors = [];

    for (const field of CUSTOMER_FIELDS) {
      const externalKey = fieldMapping[field];

      if (externalKey && externalKey.trim() !== "") {
        // Support nested keys like "address.city"
        const value = getNestedValue(record, externalKey);
        customer[field] = value != null ? String(value).trim() : "";
      } else if (defaults[field] != null) {
        customer[field] = defaults[field];
      } else {
        customer[field] = "";
      }
    }

    // Set appointedUser to owner if not mapped
    if (!customer.appointedUser) {
      customer.appointedUser = ownerName || "";
    }

    // Validate required fields
    const valid = !!(customer.name && customer.email);
    if (!customer.name) errors.push("Missing name");
    if (!customer.email) errors.push("Missing email");

    return {
      rowNumber: index + 1,
      customer: valid ? customer : null,
      valid,
      errors,
      preview: {
        name: customer.name || "—",
        email: customer.email || "—",
        businessName: customer.businessName || "—",
        contactNo: customer.contactNo || "—",
        country: customer.country || "—",
        category: customer.category || "—",
      },
    };
  });
};

// ── Helper: resolve nested value ──────────────────────────────────
const getNestedValue = (obj, path) => {
  if (!path) return undefined;
  const parts = path.split(".");
  let current = obj;
  for (const part of parts) {
    if (current == null || typeof current !== "object") return undefined;
    current = current[part];
  }
  return current;
};
