import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import session from 'express-session';
import 'dotenv/config';
import passport from 'passport';

declare const module: any;

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: console,
  });

  const devCorsOption = {
    origin: 'http://localhost:9000',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    optionsSuccessStatus: 204,
    credentials: true,
  };
  app.enableCors(devCorsOption);

  const sessionOption = {
    secret: process.env.COOKIE_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false },
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