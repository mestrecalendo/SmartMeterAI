import "reflect-metadata";
import { DataSource } from "typeorm";
import dotenv from 'dotenv'
import { Measure } from "../api/entity/Measure";
import { Customer } from "../api/entity/Customer";

dotenv.config()

const AppDataSource = new DataSource({
  type: "postgres",
  host: 'db',
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

export const conectarDB = async () => {
  try {
    await AppDataSource.initialize()
    console.log("Data Source has been initialized!");
    return AppDataSource;
  } catch (err) {
    console.error("Error during Data Source initialization", err);
  }
};
