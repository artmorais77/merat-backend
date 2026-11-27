import { Module } from "@nestjs/common";
import { PrismaModule } from "./modules/prisma/prisma.module.js";
import { ConfigModule } from "@nestjs/config";
import { validate } from "./config/env.validation.js";
import { AuthModule } from "./modules/auth/auth.module.js";
import { APP_GUARD } from "@nestjs/core";
import { AuthGuard } from "./modules/auth/guards/auth.guard.js";
@Module({
	imports: [
		PrismaModule,
		ConfigModule.forRoot({
			validate,
		}),
		AuthModule,
	],
	providers: [{ provide: APP_GUARD, useClass: AuthGuard }],
})
export class AppModule {}
