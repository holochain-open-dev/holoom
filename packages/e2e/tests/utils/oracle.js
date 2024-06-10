module.exports.postOracleWebhook = async function (type, data) {
  return await fetch("http://localhost:8001/webhook-ingress", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type, data }),
  });
};
