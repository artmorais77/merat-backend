import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const main = async () => {
	await prisma.$transaction(async (db) => {
		const modulePlatform = await db.module.upsert({
			where: { slug: "platform" },
			update: {},
			create: {
				name: "Plataforma",
				slug: "platform",
			},
		});

		await db.permission.upsert({
			where: { slug: "all" },
			update: {},
			create: {
				name: "Todas",
				slug: "all",
				description: "Concede todas as permissões do sistema",
				module_id: modulePlatform.id,
			},
		});
	});
};

await main();
