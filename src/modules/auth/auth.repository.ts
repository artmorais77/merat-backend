import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service.js";

interface ICreateRefreshToken {
	userId: string;
	tokenHash: string;
	expiresAt: Date;
}

interface IRotateRefreshToken extends ICreateRefreshToken {
	idOldRefreshToken: string;
	familyId: string;
}

@Injectable()
export class AuthRepository {
	constructor(private readonly prismaService: PrismaService) {}

	async findUserByEmail(email: string) {
		return await this.prismaService.user.findFirst({ where: { email } });
	}

	async findUserById(user_id: string) {
		return await this.prismaService.user.findUnique({ where: { id: user_id }, omit: { password_hash: true } });
	}

	async insertRefreshTokenHash(params: ICreateRefreshToken) {
		return await this.prismaService.refreshToken.create({
			data: {
				user_id: params.userId,
				token_hash: params.tokenHash,
				expires_at: params.expiresAt,
			},
		});
	}

	async findTokenByTokenHash(refreshTokenHash: string) {
		return await this.prismaService.refreshToken.findFirst({ where: { token_hash: refreshTokenHash } });
	}

	async revokeTokenByFamilyId(familyId: string) {
		return await this.prismaService.refreshToken.updateMany({
			where: { family_id: familyId, revoked_at: null },
			data: {
				revoked_at: new Date(Date.now()),
			},
		});
	}

	async rotateRefreshToken(params: IRotateRefreshToken) {
		return await this.prismaService.$transaction(async (db) => {
			const newRefreshToken = await db.refreshToken.create({
				data: {
					user_id: params.userId,
					family_id: params.familyId,
					token_hash: params.tokenHash,
					expires_at: params.expiresAt,
				},
			});

			await db.refreshToken.update({
				where: { id: params.idOldRefreshToken },
				data: {
					replaced_by_id: newRefreshToken.id,
					revoked_at: new Date(Date.now()),
				},
			});
		});
	}
}
