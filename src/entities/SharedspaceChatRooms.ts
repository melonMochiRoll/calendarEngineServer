import { UUIDV7Transformer } from "src/common/transformer/uuidv7Transformer";
import { Column, Entity, Index, JoinColumn, ManyToOne, OneToOne, PrimaryColumn } from "typeorm";
import { Sharedspaces } from "./Sharedspaces";
import { ChatRooms } from "./ChatRooms";

@Entity({ name: 'sharedspace_chatrooms' })
export class SharedspaceChatRooms {
  @PrimaryColumn({ type: 'binary', name: 'id', length: 16, transformer: new UUIDV7Transformer() })
  id: string;

  @Column({ type: 'binary', name: 'SharedspaceId', length: 16, transformer: new UUIDV7Transformer() })
  SharedspaceId: string;

  @OneToOne(() => ChatRooms, chatRooms => chatRooms.SharedspaceChatRoom)
  @JoinColumn({
    name: 'id',
    referencedColumnName: 'id',
    foreignKeyConstraintName: 'sharedspace_chatrooms_id_fk',
  })
  ChatRoom: ChatRooms;

  @Index('sharedspace_chatrooms_SharedspaceId_fk_idx')
  @ManyToOne(() => Sharedspaces, sharedspaces => sharedspaces.ChatRooms, {
    onUpdate: 'CASCADE',
  })
  @JoinColumn({
    name: 'SharedspaceId',
    referencedColumnName: 'id',
    foreignKeyConstraintName: 'sharedspace_chatrooms_SharedspaceId_fk'
  })
  Sharedspace: Sharedspaces;
}