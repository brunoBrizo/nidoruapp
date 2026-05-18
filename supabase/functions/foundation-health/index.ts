const healthPayload = {
  service: "foundation-health",
  status: "ok",
} as const;

export default {
  fetch() {
    return Response.json(healthPayload, {
      headers: {
        "cache-control": "no-store",
      },
    });
  },
};
