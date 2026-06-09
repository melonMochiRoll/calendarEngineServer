import { Column, CreateDateColumn, Entity, Index, JoinTable, ManyToMany, OneToMany, OneToOne, PrimaryColumn, UpdateDateColumn } from "typeorm";
import { Todos } from "./Todos";
import { Sharedspaces } from "./Sharedspaces";
import { SpaceMembers } from "./SpaceMembers";
import { JoinRequests } from "./JoinRequests";
import { Chats } from "./Chats";
import { RefreshTokens } from "./RefreshTokens";
import { Invites } from "./Invites";
import { UUIDV7Transformer } from "src/common/transformer/uuidv7Transformer";
import { Spaces } from "./Spaces";
import { ProfileImages } from "./ProfileImages";

@Index('users_createdAt_idx', ['createdAt'])
@Entity({ name: 'users' })
export class Users {
  @PrimaryColumn({ type: 'binary', name: 'id', length: 16, transformer: new UUIDV7Transformer() })
  id: string;

  @Column({ type: 'varchar', name: 'email', length: 50, unique: true })
  email: string;

  @Column({ type: 'varchar', name: 'nickname', length: 20, unique: true })
  nickname: string;

  @Column({ type: 'varchar', length: 100, select: false, nullable: true })
  password: string;

  @Column({ type: 'varchar', length: 20 })
  provider: string;

  @Column({ type: 'varchar', length: 20 })
  status: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'datetime', precision: 6, nullable: true, default: null })
  removedAt: Date | null;

  @OneToOne(() => ProfileImages, profileImages => profileImages.User)
  ProfileImage: ProfileImages;

  @OneToMany(() => Todos, todos => todos.Author)
  Todos: Todos[];

  @OneToMany(() => Todos, todos => todos.Editor)
  EditedTodos: Todos[];

  @OneToMany(() => Sharedspaces, sharedspaces => sharedspaces.Owner)
  OwnedSharedspaces: Sharedspaces[];

  @OneToMany(() => SpaceMembers, spacemembers => spacemembers.User)
  Spacemembers: SpaceMembers[];

  @OneToMany(() => JoinRequests, joinRequests => joinRequests.Requestor)
  JoinRequests: JoinRequests[];

  @OneToMany(() => Chats, chats => chats.Sender)
  Chats: Chats[];

  @OneToMany(() => RefreshTokens, refreshTokens => refreshTokens.User)
  RefreshTokens: RefreshTokens[];

  @OneToMany(() => Invites, invites => invites.Inviter)
  SentInvites: Invites[];

  @OneToMany(() => Invites, invites => invites.Invitee)
  ReceivedInvites: Invites[];

  @ManyToMany(() => Spaces, spaces => spaces.Members)
  @JoinTable({
    name: 'spacemembers',
    joinColumn: {
      name: 'UserId',
      referencedColumnName: 'id'
    },
    inverseJoinColumn: {
      name: 'SpaceId',
      referencedColumnName: 'id'
    }
  })
  Spaces: Spaces[];
}