import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
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

  @Column({ type: 'int', name: 'RoleId' })
  RoleId: number;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ type: 'text' })
  message: string;

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
    name: 'RoleId',
    referencedColumnName: 'id',
    foreignKeyConstraintName: 'joinrequests_RoleId_fk'
  })
  Role: Roles;
}