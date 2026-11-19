function toApi(value) {
  if (Array.isArray(value)) return value.map(toApi);
  if (!value || typeof value !== "object" || value instanceof Date) return value;
  const result = {};
  for (const [key, nested] of Object.entries(value)) {
    if (key === "id") result._id = nested;
    else if (!key.endsWith("Id")) result[key] = toApi(nested);
  }
  return result;
}
module.exports = { toApi };
