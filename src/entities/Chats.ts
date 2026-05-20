import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, OneToMany, PrimaryColumn, UpdateDateColumn } from "typeorm";
import { Users } from "./Users";
import { UUIDV7Transformer } from "src/common/function/uuidv7Transformer";
import { Spaces } from "./Spaces";
import { ChatImages } from "./ChatImages";

@Index('chats_createdAt_idx', ['createdAt'])
@Entity({ name: 'chats' })
export class Chats {
  @PrimaryColumn({ type: 'binary', name: 'id', length: 16, transformer: new UUIDV7Transformer() })
  id: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'binary', name: 'SenderId', length: 16, transformer: new UUIDV7Transformer() })
  SenderId: string;

  @Column({ type: 'binary', name: 'SpaceId', length: 16, transformer: new UUIDV7Transformer() })
  SpaceId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
  
  @Column({ type: 'datetime', precision: 6, nullable: true, default: null })
  removedAt: Date | null;

  @OneToMany(() => ChatImages, chatImages => chatImages.Chat)
  ChatImages: ChatImages[];

  @ManyToOne(() => Users, users => users.Todos)
  @JoinColumn({
    name: 'SenderId',
    referencedColumnName: 'id',
    foreignKeyConstraintName: 'chats_SenderId_fk',
  })
  Sender: Users;

  @ManyToOne(() => Spaces, spaces => spaces.Chats)
  @JoinColumn({
    name: 'SpaceId',
    referencedColumnName: 'id',
    foreignKeyConstraintName: 'chats_SpaceId_fk',
  })
  Space: Spaces;
}