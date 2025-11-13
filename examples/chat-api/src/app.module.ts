import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TaylorModule } from './taylor/taylor.module';

@Module({
  imports: [TaylorModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
