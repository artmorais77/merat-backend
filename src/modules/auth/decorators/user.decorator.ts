import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { Request } from "express";
import { IJwtPayload } from "../../../shared/types/express.js";

export const User = createParamDecorator((field: keyof IJwtPayload | undefined, context: ExecutionContext) => {
	const req = context.switchToHttp().getRequest<Request>();
	const user = req.user;

	return field ? user?.[field] : user;
});
