import { Module } from '@nestjs/common';
import { TaylorDBProvider } from './taylor.provider';

@Module({
  providers: [TaylorDBProvider],
  exports: [TaylorDBProvider],
})
export class TaylorModule {}
