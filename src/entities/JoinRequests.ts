import { Column, CreateDateColumn, DeleteDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Users } from "./Users";
import { Sharedspaces } from "./Sharedspaces";

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

  @Column({ type: 'text' })
  message: string;

  @ManyToOne(() => Sharedspaces, sharedspaces => sharedspaces.JoinRequests, {
    onUpdate: 'CASCADE',
    orphanedRowAction: 'soft-delete',
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
}