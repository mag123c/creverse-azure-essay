export const isLocal = (): boolean => process.env.NODE_ENV === 'local';
export const isTest = (): boolean => process.env.NODE_ENV === 'test';
export const isDevelopment = (): boolean => process.env.NODE_ENV === 'development';
export const isProduction = (): boolean => process.env.NODE_ENV === 'production';
