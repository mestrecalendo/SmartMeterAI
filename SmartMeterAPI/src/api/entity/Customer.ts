import { Entity, PrimaryGeneratedColumn, Column } from "typeorm"

@Entity()
export class Customer {
    
    @PrimaryGeneratedColumn('uuid')
    customer_code: string;
}
