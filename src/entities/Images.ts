import { Column, CreateDateColumn, DeleteDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Chats } from "./Chats";

@Index('images_createdAt_idx', ['createdAt'])
@Entity({ name: 'images' })
export class Images {
  @PrimaryGeneratedColumn({ type: 'int', name: 'id' })
  id: number;

  @Column({ type: 'text' })
  path: string;

  @Column({ type: 'varchar', name: 'status', length: 255, default: 'PENDING' })
  status: string;

  @Column({ type: 'int', name: 'ChatId' })
  ChatId: number;

  @CreateDateColumn()
  createdAt: Date;

  @DeleteDateColumn()
  deletedAt: Date | null;

  @ManyToOne(() => Chats, chats => chats.Images, {
    onUpdate: 'CASCADE',
    orphanedRowAction: 'soft-delete',
  })
  @JoinColumn({
    name: 'ChatId',
    referencedColumnName: 'id',
    foreignKeyConstraintName: 'images_ChatId_fk',
  })
  Chat: Chats;
}