import { Entity, PrimaryGeneratedColumn, Column, OneToMany, Unique } from "typeorm"
import { Measure } from "./Measure";

@Entity()
export class Customer {
    
    @PrimaryGeneratedColumn('uuid')
    id: string

    @Column({type: "varchar", unique: true })
    customer_code: string;

    @OneToMany(() => Measure, (measure) => measure.customer)
    measures: Measure[]
}
