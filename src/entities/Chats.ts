import { Column, CreateDateColumn, DeleteDateColumn, Entity, Index, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { Users } from "./Users";
import { Sharedspaces } from "./Sharedspaces";
import { Images } from "./Images";

@Index('chats_createdAt_idx', ['createdAt'])
@Entity({ name: 'chats' })
export class Chats {
  @PrimaryGeneratedColumn({ type: 'int', name: 'id' })
  id: number;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'int', name: 'SenderId' })
  SenderId: number;

  @Column({ type: 'int', name: 'SharedspaceId' })
  SharedspaceId: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
  
  @DeleteDateColumn()
  deletedAt: Date | null;

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