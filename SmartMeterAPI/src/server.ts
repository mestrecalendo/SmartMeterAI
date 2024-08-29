import express, { Application } from "express";
import * as bodyParser from "body-parser";
import swaggerUi from "swagger-ui-express";
import * as cors from "cors";
import swaggerFile from '../src/config/swagger.json'
import { router } from "./api/routes";
import { conectarDB } from "./config/data-source";

const PORTA = 3000;
const app: Application = express();

app.use(bodyParser.json());

app.use(cors());

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerFile));

//rotas
app.use("/usuario", router);
app.use("/lancamento", router);
app.use("/:costumer_code/list", router);

conectarDB();
const server =
    app.listen(PORTA, () => console.log(`App ouvindo na porta ${PORTA}`));

process.on('SIGINT', () => {
    server.close();
    console.log('App finalizado');
});