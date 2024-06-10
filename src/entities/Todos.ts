import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Users } from "./Users";
import { IsBoolean, IsString } from "class-validator";

@Entity()
export class Todos {

  @PrimaryGeneratedColumn({
    type: 'int',
    unsigned: true,
  })
  id: number;

  @IsString()
  @Column({
    type: 'varchar',
    length: 30,
  })
  contents: string;

  @IsBoolean()
  @Column({
    type: 'boolean',
    default: 0,
  })
  isComplete: boolean;

  @Index('todos_date_idx')
  @Column({
    type: 'date'
  })
  date: Date;

  @Column({
    type: 'date',
    nullable: true,
  })
  deadline: Date;

  @Column({
    type: 'int',
    name: 'UserId',
    unsigned: true,
  })
  UserId: number;

  @Index('todos_userid_fk_idx')
  @ManyToOne(() => Users, users => users.Todos, {
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
  })
  @JoinColumn({
    name: 'UserId',
    referencedColumnName: 'id',
    foreignKeyConstraintName: 'todos_userid_fk',
  })
  User: Users;
}