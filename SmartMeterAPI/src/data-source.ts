import "reflect-metadata"
import { DataSource } from "typeorm"
import { Measure } from "./entity/Measure"
import { Customer } from "./entity/Customer"
require('dotenv').config();

export const AppDataSource = new DataSource({
    type: "postgres",
    host: "localhost",
    port: 5432,
    username: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    database: process.env.POSTGRES_DB,
    synchronize: true,
    logging: false,
    entities: [Customer, Measure],
    migrations: [],
    subscribers: [],
})
