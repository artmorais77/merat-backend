import { Module } from "@nestjs/common";
import { PrismaModule } from "./modules/prisma/prisma.module.js";
import { ConfigModule } from "@nestjs/config";
import { validate } from "./config/env.validation.js";
@Module({
	imports: [
		PrismaModule,
		ConfigModule.forRoot({
			validate,
		}),
	],
})
export class AppModule {}
