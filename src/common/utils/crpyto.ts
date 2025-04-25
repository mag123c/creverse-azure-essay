export const generateTraceId = (): string => {
  return crypto.randomUUID();
};
