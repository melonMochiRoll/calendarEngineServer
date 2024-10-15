import { Column, CreateDateColumn, DeleteDateColumn, Entity, JoinTable, ManyToMany, OneToMany, PrimaryGeneratedColumn, Unique, UpdateDateColumn } from "typeorm";
import { Todos } from "./Todos";
import { Sharedspaces } from "./Sharedspaces";
import { SharedspaceMembers } from "./SharedspaceMembers";

@Unique('users_email_idx', ['email'])
@Entity({ name: 'users' })
export class Users {
  @PrimaryGeneratedColumn({ type: 'int', name: 'id' })
  id: number;

  @Column({ type: 'varchar', name: 'email', length: 30 })
  email: string;

  @Column({ type: 'varchar', length: 100, select: false })
  password: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date | null;

  @OneToMany(() => Todos, todos => todos.Author)
  Todos: Todos[];

  @OneToMany(() => Todos, todos => todos.Editor)
  EditedTodos: Todos[];

  @OneToMany(() => Sharedspaces, sharedspaces => sharedspaces.Owner)
  OwnedSharedspaces: Sharedspaces[];

  @OneToMany(() => SharedspaceMembers, sharedspacemembers => sharedspacemembers.User)
  Sharedspacemembers: SharedspaceMembers[];

  @ManyToMany(() => Sharedspaces, sharedspaces => sharedspaces.Members)
  @JoinTable({
    name: 'sharedspacemembers',
    joinColumn: {
      name: 'UserId',
      referencedColumnName: 'id'
    },
    inverseJoinColumn: {
      name: 'SharedspaceId',
      referencedColumnName: 'id'
    }
  })
  Sharedspaces: Sharedspaces[];
}