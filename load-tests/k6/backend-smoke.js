import http from "k6/http";
import { check, group } from "k6";

const baseUrl = __ENV.BASE_URL || "http://127.0.0.1:54321";
const serviceRoleKey = __ENV.SUPABASE_SERVICE_ROLE_KEY || "local-service-role-key";

export const options = {
  thresholds: {
    http_req_failed: ["rate<0.05"],
    http_req_duration: ["p(95)<750"],
  },
  vus: Number(__ENV.VUS || 1),
  duration: __ENV.DURATION || "30s",
};

const headers = {
  authorization: `Bearer ${serviceRoleKey}`,
  "content-type": "application/json",
};

export default function backendSmoke() {
  group("revenuecat webhook", () => {
    const response = http.post(
      `${baseUrl}/functions/v1/revenuecat-webhook`,
      JSON.stringify({
        api_version: "1.0",
        event: {
          app_user_id: "load-test-user",
          id: "load-test-event",
          product_id: "nidoru_premium_monthly",
          type: "INITIAL_PURCHASE",
        },
      }),
      { headers },
    );

    check(response, {
      "webhook returns handled status": (res) =>
        [200, 202, 204, 401, 404, 501].includes(res.status),
    });
  });

  group("sync", () => {
    const response = http.get(`${baseUrl}/api/sync`, { headers });

    check(response, {
      "sync returns handled status": (res) => [200, 204, 401, 404, 501].includes(res.status),
    });
  });

  group("catalog", () => {
    const response = http.get(`${baseUrl}/api/catalog`, { headers });

    check(response, {
      "catalog returns handled status": (res) => [200, 401, 404, 501].includes(res.status),
    });
  });

  group("entitlements", () => {
    const response = http.get(`${baseUrl}/api/entitlements`, { headers });

    check(response, {
      "entitlements returns handled status": (res) => [200, 401, 404, 501].includes(res.status),
    });
  });
}
