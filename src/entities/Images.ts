import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryColumn } from "typeorm";
import { Chats } from "./Chats";
import { UUIDV7Transformer } from "src/common/function/uuidv7Transformer";

@Index('images_createdAt_idx', ['createdAt'])
@Entity({ name: 'images' })
export class Images {
  @PrimaryColumn({ type: 'binary', name: 'id', length: 16, transformer: new UUIDV7Transformer() })
  id: string;

  @Column({ type: 'text' })
  path: string;

  @Column({ type: 'varchar', name: 'status', length: 30, default: 'pending' })
  status: string;

  @Column({ type: 'binary', name: 'ChatId', length: 16, nullable: true, transformer: new UUIDV7Transformer() })
  ChatId: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ type: 'datetime', precision: 6, nullable: true, default: null })
  removedAt: Date | null;

  @ManyToOne(() => Chats, chats => chats.Images, {
    onUpdate: 'CASCADE',
  })
  @JoinColumn({
    name: 'ChatId',
    referencedColumnName: 'id',
    foreignKeyConstraintName: 'images_ChatId_fk',
  })
  Chat: Chats;
}