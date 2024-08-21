import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryColumn } from "typeorm";
import { Users } from "./Users";
import { Sharedspaces } from "./Sharedspaces";

@Entity({ name: 'sharedspacemembers' })
export class SharedspaceMembers {

  @PrimaryColumn({ type: 'int', name: 'UserId' })
  UserId: number;

  @PrimaryColumn({ type: 'int', name: 'SharedspaceId' })
  SharedspaceId: number;

  @Column({ type: 'varchar', length: 100 })
  role: string;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => Users, users => users.Sharedspacemembers, {
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
  })
  @JoinColumn({
    name: 'UserId',
    referencedColumnName: 'id',
  })
  User: Users;

  @ManyToOne(() => Sharedspaces, sharedspace => sharedspace.Sharedspacemembers, {
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
  })
  @JoinColumn({
    name: 'SharedspaceId',
    referencedColumnName: 'id',
  })
  Sharedspace: Sharedspaces;
}