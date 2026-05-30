import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Security: Helmet for HTTP security headers
  app.use(helmet());

  // Security: CORS configuration from environment
  // CORS_ORIGIN can be a comma-separated list: "https://domain1.com,https://domain2.com"
  const allowedOrigins = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim())
    : ['http://localhost:3001', 'https://ecommerce-frontend-two-khaki-48.vercel.app'];

  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
  });

  // Security: Whitelist + forbidNonWhitelisted to prevent mass assignment
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Security: Only expose Swagger in non-production
  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('E-Commerce API')
      .setDescription('API Documentation untuk project UKL E-Commerce')
      .setVersion('1.0')
      .addBearerAuth(
        { type: 'http', scheme: 'bearer', bearerFormat: 'JWT', description: 'Masukkan JWT token' },
        'JWT-auth',
      )
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api-docs', app, document);
  }

  await app.listen(3000);
  console.log('Server running on http://localhost:3000');
  if (process.env.NODE_ENV !== 'production') {
    console.log('Swagger docs: http://localhost:3000/api-docs');
  }
}
bootstrap();