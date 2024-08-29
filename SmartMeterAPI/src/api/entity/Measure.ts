import { Entity, Column, ManyToOne, PrimaryGeneratedColumn } from "typeorm"
import { Customer } from "./Customer";

@Entity()
export class Measure {

    @PrimaryGeneratedColumn('uuid')
    measure_uuid: string;

    @Column({type: "timestamp"})
    measure_datetime: Date;

    @Column({type: "varchar"})
    measure_type: string;

    @Column({type: "int"})
    measure_value: number;

    @Column({type: "boolean", default: false})
    has_confirmed: boolean;

    @Column({ type: "text" })
    image_url: string;

    @ManyToOne(() => Customer, (customer) => customer.measures)
    customer: Customer
}
