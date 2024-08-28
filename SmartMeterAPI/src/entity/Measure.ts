import { Entity, PrimaryGeneratedColumn, Column } from "typeorm"

@Entity()
export class Measure {

    @PrimaryGeneratedColumn('uuid')
    measure_uuid: string;

    @Column()
    measure_datetime: Date;

    @Column()
    measure_type: string;

    @Column()
    has_confirmed:boolean;

    @Column()
    image_url: string;
}
