import { NestFactory } from "@nestjs/core";
import { ConfigService } from "@nestjs/config";
import { AppModule } from "./app.module.js";
import { setupSwagger } from "./config/swagger.js";
import cookieParser from "cookie-parser";

async function bootstrap() {
	const app = await NestFactory.create(AppModule);
	const configService = app.get(ConfigService);

	setupSwagger(app);
	app.use(cookieParser());
	app.enableCors({
		origin: configService.getOrThrow<string>("FRONTEND_URL"),
		credentials: true,
	});
	await app.listen(configService.get<number>("PORT") ?? 3333);
}
await bootstrap();
