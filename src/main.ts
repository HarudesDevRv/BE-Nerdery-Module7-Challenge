import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { graphqlUploadExpress } from 'graphql-upload-ts';
import helmet from 'helmet';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { PrismaExceptionFilter } from './common/filters/prisma-exception.filter';
import { StripeExceptionFilter } from './common/filters/stripe-exception.filter';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

const PORT = process.env.PORT || 3000;
async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    rawBody: true,
  });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useGlobalFilters(
    new AllExceptionsFilter(),
    new HttpExceptionFilter(),
    new PrismaExceptionFilter(),
    new StripeExceptionFilter(),
  );
  app.use(graphqlUploadExpress());
  app.enableCors();
  app.use(helmet());
  app.set('query parser', 'extended');

  const config = new DocumentBuilder()
    .setTitle('Cats example')
    .setDescription('The cats API description')
    .setVersion('1.0')
    .addTag('cats')
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, documentFactory);

  await app.listen(PORT ?? 3000);
}
bootstrap()
  .then(() => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(
      `You can see the REST Api documentation on http://localhost:${PORT}/api`,
    );
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
