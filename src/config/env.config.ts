export const envConfig = () => {
  return {
    isGlobal: true,
    envFilePath: [`.env.${process.env.NODE_ENV}`, '.env'],
  };
};
