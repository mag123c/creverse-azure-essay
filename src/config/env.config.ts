export const envConfig = () => {
  return {
    isGlobal: true,
    envFilePath: ['.env', `.env.${process.env.NODE_ENV}`],
  };
};
