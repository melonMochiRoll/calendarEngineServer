import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { SharedspaceMembers } from "./SharedspaceMembers";

@Entity({ name: 'roles' })
export class Roles {
  @PrimaryGeneratedColumn({ type: 'int', name: 'id' })
  id: number;

  @Column({ type: 'varchar', name: 'name', length: 100, unique: true })
  name: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => SharedspaceMembers, sharedspaceMembers => sharedspaceMembers.Role, {
    cascade: ['update', 'soft-remove', 'recover'],
  })
  SharedspaceMembers: SharedspaceMembers[];
}