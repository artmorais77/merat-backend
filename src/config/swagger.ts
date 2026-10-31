import { INestApplication } from "@nestjs/common";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";

const setupSwagger = (app: INestApplication): void => {
	const config = new DocumentBuilder()
		.setTitle("Merat API")
		.setDescription("Descrição dos endpoints")
		.setVersion("1.0")
		.build();

	const documentFactory = () => SwaggerModule.createDocument(app, config);

	SwaggerModule.setup("api", app, documentFactory);
};

export { setupSwagger };
