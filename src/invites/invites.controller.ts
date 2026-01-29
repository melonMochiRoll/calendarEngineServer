import { Controller } from "@nestjs/common";
import { InvitesService } from "./invites.service";

@Controller('api/invites')
export class InvitesContoller {
  constructor(
    private invitesService: InvitesService
  ) {}
}