import { plainToClass } from "class-transformer";
import { IsIn, IsNumber, IsOptional, IsString, validateSync } from "class-validator";

class EnvironmentVariables {
	@IsOptional()
	@IsIn(["dev", "prod"])
	NODE_ENV: "dev" | "prod" = "dev";

	@IsNumber()
	PORT: number;

	@IsString()
	FRONTEND_URL: string;

	@IsString()
	DATABASE_URL: string;

	@IsString()
	JWT_ACCESS_TOKEN_SECRET: string;

	@IsString()
	JWT_REFRESH_TOKEN_SECRET: string;
}

export function validate(config: Record<string, unknown>) {
	const validatedConfig = plainToClass(EnvironmentVariables, config, { enableImplicitConversion: true });

	const erros = validateSync(validatedConfig, { skipMissingProperties: false });

	if (erros.length > 0) throw new Error(erros.toString());

	return validatedConfig;
}
