import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import cookieParser from 'cookie-parser';
import { join } from 'node:path';
import { AppModule } from './app.module';
import { HtmlExceptionFilter } from './common/html-exception.filter';
import { configureViews } from './views/setup';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const root = join(__dirname, '..');

  app.use(cookieParser());
  app.useStaticAssets(join(root, 'public'), { prefix: '/static/' });
  configureViews(app, join(root, 'views'));
  app.useGlobalFilters(new HtmlExceptionFilter());
  app.enableShutdownHooks();

  const port = Number(process.env.PORT ?? 5113);
  await app.listen(port, '0.0.0.0');
  console.log(`Shiftly is running on http://localhost:${port}`);
}

void bootstrap();
