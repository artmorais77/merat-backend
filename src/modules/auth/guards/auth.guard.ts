import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from "@nestjs/common";
import { Request } from "express";
import { Reflector } from "@nestjs/core";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class AuthGuard implements CanActivate {
	constructor(
		private readonly reflector: Reflector,
		private readonly jwtService: JwtService,
		private readonly configService: ConfigService,
	) {}

	async canActivate(context: ExecutionContext): Promise<boolean> {
		const isPublic = this.reflector.getAllAndOverride<boolean>("isPublic", [context.getHandler(), context.getClass()]);

		if (isPublic) return true;

		const req = context.switchToHttp().getRequest<Request>();
		const token = req.cookies?.access_token;

		if (!token) throw new UnauthorizedException("Não autenticado");

		try {
			const payload = await this.jwtService.verifyAsync(token, {
				secret: this.configService.getOrThrow<string>("JWT_ACCESS_TOKEN_SECRET"),
			});

			req.user = payload;

			return true;
		} catch {
			throw new UnauthorizedException("Token inválido ou expirado");
		}
	}
}
