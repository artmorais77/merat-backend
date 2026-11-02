import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module.js";
import { setupSwagger } from "./config/swagger.js";
import cookieParser from "cookie-parser";

async function bootstrap() {
	const app = await NestFactory.create(AppModule);
	setupSwagger(app);
	app.use(cookieParser());
	app.enableCors({
		origin: "*",
		credentials: true,
	});
	await app.listen(process.env.PORT ?? 3333);
}
await bootstrap();
