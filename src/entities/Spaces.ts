import { UUIDV7Transformer } from "src/common/transformer/uuidv7Transformer";
import { Column, CreateDateColumn, Entity, ManyToMany, OneToMany, OneToOne, PrimaryColumn, UpdateDateColumn } from "typeorm";
import { SpaceMembers } from "./SpaceMembers";
import { Chats } from "./Chats";
import { Users } from "./Users";
import { Sharedspaces } from "./Sharedspaces";
import { ChatRooms } from "./ChatRooms";
import { SPACE_URL_LENGTH } from "src/common/constant/constants";

@Entity({ name: 'spaces' })
export class Spaces {
  @PrimaryColumn({ type: 'binary', name: 'id', length: 16, transformer: new UUIDV7Transformer() })
  id: string;
}