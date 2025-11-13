import { Inject, Injectable } from '@nestjs/common';
import { createQueryBuilder } from '@taylordb/query-builder';
import { CreateChatDto } from './dto/create-chat.dto';
import { CreateMessageDto } from './dto/create-message.dto';
import { TaylorDatabase } from './taylor.types';

type QueryBuilder = ReturnType<typeof createQueryBuilder<TaylorDatabase>>;

@Injectable()
export class AppService {
  constructor(@Inject('TAYLOR_DB') private readonly qb: QueryBuilder) {}

  getHello(): string {
    return 'Hello World!';
  }

  async createChat(createChatDto: CreateChatDto) {
    const { name, userId } = createChatDto;

    // First, create a user if they don't exist, or retrieve them.
    // For simplicity, we'll assume the user exists and has id = userId.
    // In a real app, you'd likely have a findOrCreate a user here.

    const newChat = await this.qb.insertInto('chat').values({
      name,
    }).execute();


    return newChat;
  }

  async createMessage(createMessageDto: CreateMessageDto) {
    const { content, chatId, userId } = createMessageDto;

    const newMessage = await this.qb.insertInto('messages').values({
      content,
      chat: [chatId],
      user: [userId],
    });

    return newMessage;
  }
}
