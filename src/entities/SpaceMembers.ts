import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryColumn, UpdateDateColumn } from "typeorm";
import { Users } from "./Users";
import { Roles } from "./Roles";
import { UUIDV7Transformer } from "src/common/transformer/uuidv7Transformer";
import { Spaces } from "./Spaces";

@Index('spacemembers_UserId_SpaceId_uq_idx', ['UserId', 'SpaceId'], { unique: true })
@Entity({ name: 'spacemembers' })
export class SpaceMembers {
  @PrimaryColumn({ type: 'binary', name: 'id', length: 16, transformer: new UUIDV7Transformer() })
  id: string;

  @Column({ type: 'binary', name: 'UserId', length: 16, transformer: new UUIDV7Transformer() })
  UserId: string;

  @Column({ type: 'binary', name: 'SpaceId', length: 16, transformer: new UUIDV7Transformer() })
  SpaceId: string;

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

  @Index('spacemembers_SpaceId_fk_idx')
  @ManyToOne(() => Spaces, space => space.Spacemembers)
  @JoinColumn({
    name: 'SpaceId',
    referencedColumnName: 'id',
    foreignKeyConstraintName: 'spacemembers_SpaceId_fk'
  })
  Space: Spaces;

  @Index('spacemembers_RoleId_fk_idx')
  @ManyToOne(() => Roles, roles => roles.SpaceMembers)
  @JoinColumn({
    name: 'RoleId',
    referencedColumnName: 'id',
    foreignKeyConstraintName: 'spacemembers_RoleId_fk'
  })
  Role: Roles;
}