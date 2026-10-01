import { plainToClass } from "class-transformer";
import { IsNumber, IsString, validateSync } from "class-validator";

class EnvironmentVariables {
	@IsNumber()
	PORT: number;

	@IsString()
	DATABASE_URL: string;
}

export function validate(config: Record<string, unknown>) {
	const validatedConfig = plainToClass(EnvironmentVariables, config, { enableImplicitConversion: true });

	const erros = validateSync(validatedConfig, { skipMissingProperties: false });

	if (erros.length > 0) throw new Error(erros.toString());

	return validatedConfig;
}
