import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryColumn, UpdateDateColumn } from "typeorm";
import { Users } from "./Users";
import { Roles } from "./Roles";
import { UUIDV7Transformer } from "src/common/transformer/uuidv7Transformer";
import { Sharedspaces } from "./Sharedspaces";

@Index('spacemembers_UserId_SharedspaceId_uq_idx', ['UserId', 'SharedspaceId'], { unique: true })
@Entity({ name: 'spacemembers' })
export class SpaceMembers {
  @PrimaryColumn({ type: 'binary', name: 'id', length: 16, transformer: new UUIDV7Transformer() })
  id: string;

  @Column({ type: 'binary', name: 'UserId', length: 16, transformer: new UUIDV7Transformer() })
  UserId: string;

  @Column({ type: 'binary', name: 'SharedspaceId', length: 16, transformer: new UUIDV7Transformer() })
  SharedspaceId: string;

  @Column({ type: 'int', name: 'RoleId' })
  RoleId: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'datetime', precision: 6, nullable: true, default: null })
  removedAt: Date | null;

  @Index('spacemembers_UserId_fk_idx')
  @ManyToOne(() => Users, users => users.Spacemembers)
  @JoinColumn({
    name: 'UserId',
    referencedColumnName: 'id',
    foreignKeyConstraintName: 'spacemembers_UserId_fk'
  })
  User: Users;

  @Index('spacemembers_SharedspaceId_fk_idx')
  @ManyToOne(() => Sharedspaces, sharedspaces => sharedspaces.Spacemembers)
  @JoinColumn({
    name: 'SharedspaceId',
    referencedColumnName: 'id',
    foreignKeyConstraintName: 'spacemembers_SharedspaceId_fk'
  })
  Sharedspace: Sharedspaces;

  @Index('spacemembers_RoleId_fk_idx')
  @ManyToOne(() => Roles, roles => roles.SpaceMembers)
  @JoinColumn({
    name: 'RoleId',
    referencedColumnName: 'id',
    foreignKeyConstraintName: 'spacemembers_RoleId_fk'
  })
  Role: Roles;
}