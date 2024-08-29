import express, { Application } from "express";
import bodyParser from "body-parser";
import swaggerUi from "swagger-ui-express";
import cors from "cors";
import swaggerFile from '../src/config/swagger.json';
import { getImageMeasure } from './api/controller';
import { router } from "./api/routes";

const PORTA = 3000;
const app: Application = express();

app.use(bodyParser.json());

app.use(cors());
//rotas
app.use(router);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerFile));

const server =
    app.listen(PORTA, () => console.log(`App ouvindo na porta ${PORTA}`));

process.on('SIGINT', () => {
    server.close();
    console.log('App finalizado');
});