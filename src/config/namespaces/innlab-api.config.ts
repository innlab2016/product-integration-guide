import { registerAs } from '@nestjs/config';

export const innlabApiConfig = registerAs('innlabApi', () => ({
  baseUrl: process.env.INNLAB_API_BASE_URL,
  timeout: parseInt(process.env.INNLAB_API_TIMEOUT ?? '5000', 10),
}));
