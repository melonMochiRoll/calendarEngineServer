import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Invites } from "src/entities/Invites";
import { Repository } from "typeorm";

@Injectable()
export class InvitesService {
  constructor(
    @InjectRepository(Invites)
    private invitesRepository: Repository<Invites>,
  ) {}
}