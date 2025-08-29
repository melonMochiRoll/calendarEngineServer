import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Users } from "./Users";

@Entity({ name: 'refreshTokens' })
export class RefreshTokens {
  @PrimaryGeneratedColumn({ type: 'int', name: 'id' })
  id: number;

  @Column({ type: 'varchar', unique: true })
  jti: string;

  @Column({ type: 'int', name: 'UserId' })
  UserId: number;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ type: 'timestamp', precision: 6 })
  expiresAt: Date;

  @Column({ type: 'timestamp', precision: 6, nullable: true })
  revokedAt: Date;

  @ManyToOne(() => Users, users => users.RefreshTokens, {
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
  })
  @JoinColumn({
    name: 'UserId',
    referencedColumnName: 'id',
    foreignKeyConstraintName: 'refreshTokens_UserId_fk',
  })
  User: Users;
}