import { Module } from "@nestjs/common";
import { PrismaModule } from "./modules/prisma/prisma.module.js";
import { ConfigModule } from "@nestjs/config";
import { validate } from "./config/env.validation.js";
import { AuthModule } from "./modules/auth/auth.module.js";
@Module({
	imports: [
		PrismaModule,
		ConfigModule.forRoot({
			validate,
		}),
		AuthModule,
	],
})
export class AppModule {}
