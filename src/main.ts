import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { graphqlUploadExpress } from 'graphql-upload-ts';
import helmet from 'helmet';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

const PORT = process.env.PORT || 3000;
async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    rawBody: true,
  });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useGlobalFilters(new HttpExceptionFilter());
  app.use(graphqlUploadExpress());
  app.enableCors();
  app.use(helmet());
  app.set('query parser', 'extended');
  await app.listen(PORT ?? 3000);
}
bootstrap()
  .then(() => {
    console.log(`Server running on http://localhost:${PORT}`);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
