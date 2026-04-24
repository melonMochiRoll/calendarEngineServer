import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, OneToMany, PrimaryColumn, UpdateDateColumn } from "typeorm";
import { Users } from "./Users";
import { Sharedspaces } from "./Sharedspaces";
import { Images } from "./Images";
import { UUIDV7Transformer } from "src/common/function/uuidv7Transformer";

@Index('chats_createdAt_idx', ['createdAt'])
@Entity({ name: 'chats' })
export class Chats {
  @PrimaryColumn({ type: 'binary', name: 'id', length: 16, transformer: new UUIDV7Transformer() })
  id: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'binary', name: 'SenderId', length: 16, transformer: new UUIDV7Transformer() })
  SenderId: string;

  @Column({ type: 'binary', name: 'SharedspaceId', length: 16, transformer: new UUIDV7Transformer() })
  SharedspaceId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
  
  @Column({ type: 'datetime', precision: 6, nullable: true, default: null })
  removedAt: Date | null;

  @OneToMany(() => Images, images => images.Chat)
  Images: Images[];

  @ManyToOne(() => Users, users => users.Todos, {
    onUpdate: 'CASCADE',
  })
  @JoinColumn({
    name: 'SenderId',
    referencedColumnName: 'id',
    foreignKeyConstraintName: 'chats_SenderId_fk',
  })
  Sender: Users;

  @ManyToOne(() => Sharedspaces, sharedspaces => sharedspaces.Chats, {
    onUpdate: 'CASCADE',
    orphanedRowAction: 'soft-delete',
  })
  @JoinColumn({
    name: 'SharedspaceId',
    referencedColumnName: 'id',
    foreignKeyConstraintName: 'chats_SharedspaceId_fk',
  })
  Sharedspace: Sharedspaces;
}