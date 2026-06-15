import { ArgumentsHost, Catch } from "@nestjs/common";
import { BaseWsExceptionFilter, WsException } from "@nestjs/websockets";
import { ChatToClient } from "../constant/constants";
import { IWsErrorDetail } from "src/typings/types";
import { INTERNAL_SERVER_MESSAGE } from "../constant/error.message";
import { ERROR_TYPE } from "../constant/auth.constants";

@Catch(WsException)
export class WsExceptionFilter extends BaseWsExceptionFilter {

  catch(exception: WsException, host: ArgumentsHost): void {
    console.error(exception);

    const client = host.switchToWs().getClient();
    const data = host.switchToWs().getData();
    const errorObject = exception.getError() as IWsErrorDetail;

    const type = errorObject?.type || ERROR_TYPE.INTERNAL_SERVER_ERROR;
    const message = errorObject?.message || INTERNAL_SERVER_MESSAGE;

    client.emit(ChatToClient.CHAT_ERROR, {
      type,
      message,
      ChatId: data?.ChatId,
    });
  }
}