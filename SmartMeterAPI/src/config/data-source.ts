import "reflect-metadata";
import { DataSource } from "typeorm";
import { Measure } from "../api/entity/Measure";
import { Customer } from "../api/entity/Customer";
require("dotenv").config();

const AppDataSource = new DataSource({
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
});

export const conectarDB = () => {
  AppDataSource.initialize()
    .then(() => {
      console.log("Data Source has been initialized!");
    })
    .catch((err) => {
      console.error("Error during Data Source initialization", err);
    });
};
