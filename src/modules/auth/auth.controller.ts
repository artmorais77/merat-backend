import { Body, Controller, Get, HttpCode, HttpStatus, Post, Req, Res, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { AuthService } from "./auth.service.js";
import { SignInDto } from "./dto/sign-in.dto.js";
import type { CookieOptions, Request, Response } from "express";
import { Public } from "./decorators/public.decorator.js";
import { User } from "./decorators/user.decorator.js";

interface ISetAuthCookiesParams {
	accessToken: string;
	refreshToken: string;
	expiresAtAccessToken: number;
	expiresAtRefreshToken: number;
}

@Controller("auth")
export class AuthController {
	private readonly baseCookieOptions: CookieOptions;

	constructor(
		private readonly authService: AuthService,
		private readonly configService: ConfigService,
	) {
		this.baseCookieOptions = {
			httpOnly: true,
			secure: this.configService.get<string>("NODE_ENV") === "prod",
			sameSite: "strict",
		};
	}

	private setAuthCookies(res: Response, params: ISetAuthCookiesParams) {
		res.cookie("refresh_token", params.refreshToken, {
			...this.baseCookieOptions,
			path: "/auth",
			maxAge: params.expiresAtRefreshToken,
		});

		res.cookie("access_token", params.accessToken, {
			...this.baseCookieOptions,
			path: "/",
			maxAge: params.expiresAtAccessToken,
		});
	}

	private clearAuthCookies(res: Response) {
		res.clearCookie("refresh_token", {
			...this.baseCookieOptions,
			path: "/auth",
		});

		res.clearCookie("access_token", {
			...this.baseCookieOptions,
			path: "/",
		});
	}

	@Public()
	@Post("/sign-in")
	async signIn(@Body() body: SignInDto, @Res({ passthrough: true }) res: Response) {
		const result = await this.authService.signIn(body);
		if (result instanceof UnauthorizedException) {
			throw result;
		}
		const { accessToken, refreshToken, user, expiresAtRefreshToken, expiresAtAccessToken } = result;

		this.setAuthCookies(res, {
			accessToken,
			refreshToken,
			expiresAtAccessToken,
			expiresAtRefreshToken,
		});

		return { user };
	}

	@Public()
	@HttpCode(HttpStatus.NO_CONTENT)
	@Post("/sign-out")
	async signOut(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
		await this.authService.signOut(req.cookies?.refresh_token);

		this.clearAuthCookies(res);
	}

	@Public()
	@Post("/refresh")
	async refreshToken(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
		const { refresh_token } = req.cookies;

		const result = await this.authService.refreshToken(refresh_token);
		if (result instanceof UnauthorizedException) {
			throw result;
		}
		const { accessToken, refreshToken, user, expiresAtRefreshToken, expiresAtAccessToken } = result;

		this.setAuthCookies(res, {
			accessToken,
			refreshToken,
			expiresAtAccessToken,
			expiresAtRefreshToken,
		});

		return { user };
	}

	@Get("/me")
	async me(@User("user_id") userId: string) {
		return await this.authService.me(userId);
	}
}
