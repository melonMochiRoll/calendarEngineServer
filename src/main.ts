import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import session, { SessionOptions } from 'express-session';
import 'dotenv/config';
import passport from 'passport';
import { ValidationPipe } from '@nestjs/common';
import { useContainer } from 'class-validator';
import { HttpExceptionFilter } from './common/exception/http-exception.filter';
import { RedirectingExceptionFilter } from './common/exception/redirecting-exception.filter';
import helmet from 'helmet';
import { NestExpressApplication } from '@nestjs/platform-express';
import { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';
import cookieParser from 'cookie-parser';
import { RedisIoAdapter } from './events/redis.io.adapter';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import customParseFormat from 'dayjs/plugin/customParseFormat';

declare const module: any;

const isDevelopment = process.env.NODE_ENV === "development";

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: console,
  });

  app.use(helmet({
    crossOriginResourcePolicy: {
      policy: isDevelopment ? "same-site" : "same-origin",
    },
  }));

  app.set('trust proxy', true);

  useContainer(app.select(AppModule), { fallbackOnErrors: true });

  if (isDevelopment) {
    const devCorsOption: CorsOptions = {
      origin: process.env.DEV_FRONT_SERVER_ORIGIN,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
      optionsSuccessStatus: 204,
      credentials: true,
    };
    app.enableCors(devCorsOption);
  }

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

  const sessionOption: SessionOptions = {
    secret: process.env.COOKIE_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: !isDevelopment,
      sameSite: 'strict',
    },
    proxy: !isDevelopment,
  };
  app.use(session(sessionOption));
  app.use(passport.initialize());
  app.use(passport.session());
  app.use(cookieParser());

  // const redisIoAdapter = new RedisIoAdapter(app);
  // await redisIoAdapter.connectToRedis();
  // app.useWebSocketAdapter(redisIoAdapter);

  dayjs.extend(utc);
  dayjs.extend(timezone);
  dayjs.extend(isSameOrAfter);
  dayjs.extend(customParseFormat);

  const port = Number(process.env.PORT);
  await app.listen(port);
  console.log(`PORT :: ${port} server is ready`);

  if (module.hot) {
    module.hot.accept();
    module.hot.dispose(() => app.close());
  }
}

bootstrap();