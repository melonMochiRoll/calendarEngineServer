import { Controller } from "@nestjs/common";
import { ChatspacesService } from "./chatspaces.service";

@Controller('api')
export class ChatspacesController {
  constructor(
    private chatspacesService: ChatspacesService,
  ) {}
}