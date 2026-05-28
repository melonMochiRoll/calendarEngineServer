import { UUIDV7Transformer } from "src/common/function/uuidv7Transformer";
import { Column, CreateDateColumn, Entity, Index, ManyToMany, OneToMany, OneToOne, PrimaryColumn, UpdateDateColumn } from "typeorm";
import { SpaceMembers } from "./SpaceMembers";
import { Chats } from "./Chats";
import { Users } from "./Users";
import { Sharedspaces } from "./Sharedspaces";
import { ChatSpaces } from "./ChatSpaces";
import { SPACE_URL_LENGTH } from "src/common/constant/constants";

@Index('spaces_createdAt_idx', ['createdAt'])
@Entity({ name: 'spaces' })
export class Spaces {
  @PrimaryColumn({ type: 'binary', name: 'id', length: 16, transformer: new UUIDV7Transformer() })
  id: string;

  @Column({ type: 'char', name: 'url', length: SPACE_URL_LENGTH, unique: true })
  url: string;

  @Column({ type: 'varchar', length: 30 })
  type: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
  
  @Column({ type: 'datetime', precision: 6, nullable: true, default: null })
  removedAt: Date | null;

  @OneToOne(() => Sharedspaces, sharedspaces => sharedspaces.Space)
  Sharedspace: Sharedspaces;

  @OneToOne(() => ChatSpaces, chatspaces => chatspaces.Space)
  Chatspace: ChatSpaces;

  @OneToMany(() => SpaceMembers, spacemembers => spacemembers.Space)
  Spacemembers: SpaceMembers[];

  @OneToMany(() => Chats, chats => chats.Space)
  Chats: Chats[];

  @ManyToMany(() => Users, users => users.Spaces)
  Members: Users[];
}