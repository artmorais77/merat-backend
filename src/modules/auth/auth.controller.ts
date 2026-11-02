import { Body, Controller, Post, Req, Res, UnauthorizedException } from "@nestjs/common";
import { AuthService } from "./auth.service.js";
import { SignInDto } from "./dto/sign-in.dto.js";
import type { Request, Response } from "express";

@Controller("auth")
export class AuthController {
	constructor(private readonly authService: AuthService) {}

	@Post("/sign-in")
	async signIn(@Body() body: SignInDto, @Res({ passthrough: true }) res: Response) {
		const result = await this.authService.signIn(body);
		if (result instanceof UnauthorizedException) {
			throw result;
		}
		const { accessToken, refreshToken, user, expiresAt } = result;

		res.cookie("refresh_token", refreshToken, {
			httpOnly: true,
			secure: false, // quando subir para prod alterar para true
			sameSite: "strict",
			path: "/auth",
			maxAge: expiresAt,
		});

		return { accessToken, user };
	}

	@Post("/refresh")
	async refreshToken(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
		const { refresh_token } = req.cookies;

		const result = await this.authService.refreshToken(refresh_token);
		if (result instanceof UnauthorizedException) {
			throw result;
		}
		const { accessToken, refreshToken, user, expiresAt } = result;

		res.cookie("refresh_token", refreshToken, {
			httpOnly: true,
			secure: false, // quando subir para prod alterar para true
			sameSite: "strict",
			path: "/auth",
			maxAge: expiresAt,
		});

		return { accessToken, user };
	}
}
