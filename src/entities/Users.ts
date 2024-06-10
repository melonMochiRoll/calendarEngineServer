import { IsEmail, IsString } from "class-validator";
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Todos } from "./Todos";

@Entity()
export class Users {

  @PrimaryGeneratedColumn({
    type: 'int',
    unsigned: true,
  })
  id: number;

  @IsEmail()
  @Column({
    type: 'varchar',
    length: 100,
  })
  email: string;

  @IsString()
  @Column({
    type: 'varchar',
    length: 100,
  })
  password: string;

  @Column({
    type: 'date',
    default: () => '(CURRENT_DATE)',
  })
  createdAt: Date;

  @Column({
    type: 'date',
    nullable: true,
  })
  deletedAt: Date;

  @OneToMany(() => Todos, todos => todos.User)
  Todos: Todos[];
}