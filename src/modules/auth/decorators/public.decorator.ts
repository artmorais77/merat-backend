import { applyDecorators, SetMetadata } from "@nestjs/common";

export function Public() {
	return applyDecorators(SetMetadata("isPublic", true));
}
