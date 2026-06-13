export const formatAUD = (amount: number | string) => {
  const n = typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD" }).format(isNaN(n) ? 0 : n);
};
