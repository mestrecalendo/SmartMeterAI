import { AppDataSource } from "./data-source"
import { Customer } from "./entity/Customer"


AppDataSource.initialize().then(async () => {

    console.log("Inserting a new user into the database...")
    const customer = new Customer()
    await AppDataSource.manager.save(customer)
    console.log("Saved a new customer with id: " + customer.customer_code)

    console.log("Loading customers from the database...")
    const customers = await AppDataSource.manager.find(Customer)
    console.log("Loaded customers: ", customers)

    console.log("Here you can setup and run express / fastify / any other framework.")

}).catch(error => console.log(error))
