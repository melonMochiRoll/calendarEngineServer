import { UUIDV7Transformer } from "src/common/transformer/uuidv7Transformer";
import { Column, Entity, Index, JoinColumn, OneToOne, PrimaryColumn } from "typeorm";
import { ChatRooms } from "./ChatRooms";
import { ArrayTransformer } from "src/common/transformer/arrayTransformer";

@Index('dm_chatrooms_lastMessageAt_idx', ['lastMessageAt'])
@Entity({ name: 'dm_chatrooms' })
export class DmChatRooms {
  @PrimaryColumn({ type: 'binary', name: 'id', length: 16, transformer: new UUIDV7Transformer() })
  id: string;

  @Column({ type: 'varchar', name: 'name', length: 30, nullable: true })
  name: string | null;

  @Column({ type: 'datetime', name: 'lastMessageAt', precision: 6 })
  lastMessageAt: Date;

  @Column({ type: 'varchar', length: 255, transformer: new ArrayTransformer() })
  previewUserIds: string[];

  @OneToOne(() => ChatRooms, chatRooms => chatRooms.DmChatRoom)
  @JoinColumn({
    name: 'id',
    referencedColumnName: 'id',
    foreignKeyConstraintName: 'dm_chatrooms_id_fk',
  })
  ChatRoom: ChatRooms;
}