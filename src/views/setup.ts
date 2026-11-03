import type { NestExpressApplication } from '@nestjs/platform-express';
import hbs from 'hbs';
import { join } from 'node:path';
import { registerHelpers } from './helpers';

export function configureViews(app: NestExpressApplication, viewsDir: string): void {
  app.setBaseViewsDir(viewsDir);
  app.setViewEngine('hbs');
  app.set('view options', { layout: 'layouts/main' });
  hbs.registerPartials(join(viewsDir, 'partials'));
  registerHelpers(hbs);
}
