import { Module } from "@nestjs/common";
import { AuthService } from "./auth.service.js";
import { AuthController } from "./auth.controller.js";
import { AuthRepository } from "./auth.repository.js";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { JwtModule } from "@nestjs/jwt";

@Module({
	controllers: [AuthController],
	providers: [AuthService, AuthRepository],
	imports: [
		ConfigModule,
		JwtModule.registerAsync({
			imports: [ConfigModule],
			inject: [ConfigService],
			useFactory: (configService: ConfigService) => ({
				secret: configService.getOrThrow<string>("JWT_ACCESS_TOKEN_SECRET"),
				signOptions: {
					expiresIn: "15m",
				},
			}),
		}),
	],
})
export class AuthModule {}
