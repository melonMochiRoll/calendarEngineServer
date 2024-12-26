import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import session from 'express-session';
import 'dotenv/config';
import passport from 'passport';
import { ValidationPipe } from '@nestjs/common';
import { useContainer } from 'class-validator';
import { HttpExceptionFilter } from './common/exception/http-exception.filter';
import { RedirectingExceptionFilter } from './common/exception/redirecting-exception.filter';

declare const module: any;

const isDevelopment = process.env.NODE_ENV === "development";
const allowlist = isDevelopment ? ['http://localhost:9000'] : [''];

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: console,
  });

  useContainer(app.select(AppModule), { fallbackOnErrors: true }); // Enable dependency injection for custom validation

  const devCorsOption = {
    origin: allowlist,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    optionsSuccessStatus: 204,
    credentials: true,
  };
  app.enableCors(devCorsOption);

  app.useGlobalPipes(
    new ValidationPipe({
      enableDebugMessages: true,
      forbidNonWhitelisted: true,
      transform: true,
    })
  );

  app.useGlobalFilters(
    new HttpExceptionFilter(),
    new RedirectingExceptionFilter(),
  );

  const sessionOption = {
    secret: process.env.COOKIE_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: false,
    },
    proxy: !isDevelopment,
  };
  app.use(session(sessionOption));
  app.use(passport.initialize());
  app.use(passport.session());

  const port = Number(process.env.PORT);
  await app.listen(port);
  console.log(`PORT :: ${port} server is ready`);

  if (module.hot) {
    module.hot.accept();
    module.hot.dispose(() => app.close());
  }
}

bootstrap();