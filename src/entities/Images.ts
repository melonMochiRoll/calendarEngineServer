import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Chats } from "./Chats";

@Entity({ name: 'images' })
export class Images {
  @PrimaryGeneratedColumn({ type: 'int', name: 'id' })
  id: number;

  @Column({ type: 'text' })
  path: string;

  @Column({ type: 'int', name: 'ChatId' })
  ChatId: number;

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