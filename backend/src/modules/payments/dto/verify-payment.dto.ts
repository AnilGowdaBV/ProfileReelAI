import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class VerifyPaymentDto {
  @ApiProperty({ example: 'order_Pabc123XYZ' })
  @IsNotEmpty()
  @IsString()
  razorpayOrderId: string;

  @ApiProperty({ example: 'pay_Qdef456UVW' })
  @IsNotEmpty()
  @IsString()
  razorpayPaymentId: string;

  @ApiProperty({ example: '9a8b7c6d5e4f3a2b1...' })
  @IsNotEmpty()
  @IsString()
  razorpaySignature: string;

  @ApiProperty({ example: 'monthly' })
  @IsNotEmpty()
  @IsString()
  plan: string;

  @ApiPropertyOptional({ example: 'https://www.linkedin.com/in/username' })
  @IsOptional()
  @IsString()
  candidateProfileUrl?: string;
}
