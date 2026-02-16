import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { graphqlUploadExpress } from 'graphql-upload-ts';

const PORT = process.env.PORT || 3000;
async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    rawBody: true,
  });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.use(graphqlUploadExpress());
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
