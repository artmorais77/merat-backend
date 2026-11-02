import { Injectable, UnauthorizedException } from "@nestjs/common";
import { AuthRepository } from "./auth.repository.js";
import { SignInDto } from "./dto/sign-in.dto.js";
import { compare } from "bcrypt";
import { JwtService, TokenExpiredError } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import crypto from "node:crypto";

interface IPayload {
	user_id: string;
	email: string;
	exp: string;
}

@Injectable()
export class AuthService {
	constructor(
		private readonly authRepository: AuthRepository,
		private readonly jwtService: JwtService,
		private readonly configService: ConfigService,
	) {}

	private readonly generateExpiresAt = 7 * 24 * 60 * 60 * 1000;

	private async generateTokens(user_id: string, email: string) {
		const payload = { user_id, email };

		const accessToken = await this.jwtService.signAsync(payload, { jwtid: crypto.randomUUIDv7() });
		const refreshToken = await this.jwtService.signAsync(payload, {
			secret: this.configService.getOrThrow<string>("JWT_REFRESH_TOKEN_SECRET"),
			expiresIn: this.generateExpiresAt / 1000,
			jwtid: crypto.randomUUIDv7(),
		});
		return { accessToken, refreshToken };
	}

	private hashToken(token: string) {
		return crypto.createHash("sha256").update(token).digest("hex");
	}

	async signIn(body: SignInDto) {
		const user = await this.authRepository.findUserByEmail(body.email);

		if (!user || !(await compare(body.password, user?.password_hash))) {
			return new UnauthorizedException("Credenciais inválidas");
		}

		if (!user.is_active)
			return new UnauthorizedException(
				"Seu acesso foi desativado pela sua empresa. Entre em contato com o administrador da empresa.",
			);

		const { password_hash, ...userWithoutPassword } = user;

		const tokens = await this.generateTokens(user.id, user.email);

		await this.authRepository.insertRefreshTokenHash({
			userId: user.id,
			tokenHash: this.hashToken(tokens.refreshToken),
			expiresAt: new Date(Date.now() + this.generateExpiresAt),
		});

		return { ...tokens, user: userWithoutPassword, expiresAt: this.generateExpiresAt };
	}

	async refreshToken(refresh_token: string) {
		try {
			await this.jwtService.verifyAsync(refresh_token, {
				secret: this.configService.getOrThrow<string>("JWT_REFRESH_TOKEN_SECRET"),
			});
		} catch (error) {
			if (error instanceof TokenExpiredError) {
				throw new UnauthorizedException("Token expirado");
			} else {
				throw new UnauthorizedException("Token inválido");
			}
		}

		const refreshToken = await this.authRepository.findTokenByTokenHash(this.hashToken(refresh_token));

		if (!refreshToken) {
			throw new UnauthorizedException("Sessão inválida ou expirada");
		}

		if (refreshToken?.revoked_at !== null) {
			await this.authRepository.revokeTokenByFamilyId(refreshToken.family_id);
			throw new UnauthorizedException("Sessão inválida ou expirada");
		}

		const user = await this.authRepository.findUserById(refreshToken.user_id);

		if (!user?.is_active) {
			await this.authRepository.revokeTokenByFamilyId(refreshToken.family_id);
			throw new UnauthorizedException("Sessão inválida ou expirada");
		}

		const tokens = await this.generateTokens(user.id, user.email);

		await this.authRepository.rotateRefreshToken({
			userId: user.id,
			familyId: refreshToken.family_id,
			expiresAt: new Date(Date.now() + this.generateExpiresAt),
			tokenHash: this.hashToken(tokens.refreshToken),
			idOldRefreshToken: refreshToken.id,
		});

		return { ...tokens, user, expiresAt: this.generateExpiresAt };
	}
}
