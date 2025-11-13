import { Body, Controller, Get, Post } from '@nestjs/common';
import { AppService } from './app.service';
import { CreateChatDto } from './dto/create-chat.dto';
import { CreateMessageDto } from './dto/create-message.dto';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Post('chat')
  createChat(@Body() createChatDto: CreateChatDto) {
    return this.appService.createChat(createChatDto);
  }

  @Post('message')
  createMessage(@Body() createMessageDto: CreateMessageDto) {
    return this.appService.createMessage(createMessageDto);
  }
}
