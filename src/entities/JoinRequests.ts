import { Column, CreateDateColumn, DeleteDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Users } from "./Users";
import { Sharedspaces } from "./Sharedspaces";
import { Roles } from "./Roles";

@Entity({ name: 'joinrequests' })
export class JoinRequests {
  @PrimaryGeneratedColumn({ type: 'int', name: 'id' })
  id: number;

  @Column({ type: 'int', name: 'SharedspaceId' })
  SharedspaceId: number;

  @Column({ type: 'int', name: 'RequestorId', nullable: true })
  RequestorId: number | null;

  @CreateDateColumn()
  createdAt: Date;

  @DeleteDateColumn()
  deletedAt: Date | null;

  @Column({ type: 'varchar', name: 'RoleName' })
  RoleName: string;

  @ManyToOne(() => Sharedspaces, sharedspaces => sharedspaces.JoinRequests, {
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
  })
  @JoinColumn({
    name: 'SharedspaceId',
    referencedColumnName: 'id',
    foreignKeyConstraintName: 'joinrequests_SharedspaceId_fk'
  })
  Sharedspace: Sharedspaces;

  @ManyToOne(() => Users, users => users.JoinRequests, {
    onUpdate: 'CASCADE',
    onDelete: 'SET NULL',
  })
  @JoinColumn({
    name: 'RequestorId',
    referencedColumnName: 'id',
    foreignKeyConstraintName: 'joinrequests_RequestorId_fk'
  })
  Requestor: Users;

  @ManyToOne(() => Roles, roles => roles.JoinRequests, {
    onUpdate: 'CASCADE',
    onDelete: 'RESTRICT',
  })
  @JoinColumn({
    name: 'RoleName',
    referencedColumnName: 'name',
    foreignKeyConstraintName: 'joinrequests_RoleName_fk'
  })
  Role: Roles;
}