import "dotenv/config";
import { hash } from "bcrypt";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { EntityType, PrismaClient } from "../../src/generated/prisma/client.js";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const SALT_ROUNDS = 10;

const main = async () => {
	const adminEmail = process.env.SEED_ADMIN_EMAIL ?? "admin@merat.com.br";
	const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "Admin@123";
	const adminPhone = process.env.SEED_ADMIN_PHONE ?? "11999999999";
	const companyEmail = process.env.SEED_COMPANY_EMAIL ?? "contato@merat.com.br";

	const passwordHash = await hash(adminPassword, SALT_ROUNDS);

	await prisma.$transaction(async (db) => {
		const modulePlatform = await db.module.upsert({
			where: { slug: "platform" },
			update: {},
			create: {
				name: "Plataforma",
				slug: "platform",
			},
		});

		const allPermission = await db.permission.upsert({
			where: { slug: "all" },
			update: {},
			create: {
				name: "Todas",
				slug: "all",
				description: "Concede todas as permissões do sistema",
				module_id: modulePlatform.id,
			},
		});

		const company = await db.company.upsert({
			where: { email: companyEmail },
			update: {},
			create: {
				entity_type: EntityType.PJ,
				company_legal_name: "Merat Plataforma Ltda",
				trade_name: "Merat",
				email: companyEmail,
				phone: adminPhone,
				is_active: true,
			},
		});

		await db.companyModules.upsert({
			where: {
				company_id_module_id: {
					company_id: company.id,
					module_id: modulePlatform.id,
				},
			},
			update: {},
			create: {
				company_id: company.id,
				module_id: modulePlatform.id,
			},
		});

		const adminRole = await db.role.upsert({
			where: {
				company_id_name: {
					company_id: company.id,
					name: "Administrador",
				},
			},
			update: {},
			create: {
				company_id: company.id,
				name: "Administrador",
			},
		});

		await db.rolePermission.upsert({
			where: {
				role_id_permission_id: {
					role_id: adminRole.id,
					permission_id: allPermission.id,
				},
			},
			update: {},
			create: {
				role_id: adminRole.id,
				permission_id: allPermission.id,
			},
		});

		await db.user.upsert({
			where: { email: adminEmail },
			update: {},
			create: {
				company_id: company.id,
				role_id: adminRole.id,
				full_name: "Administrador",
				email: adminEmail,
				password_hash: passwordHash,
				phone: adminPhone,
				is_active: true,
			},
		});
	});

	console.log(`Seed de usuário admin concluída (${adminEmail}).`);
};

await main().finally(async () => {
	await prisma.$disconnect();
	await pool.end();
});
