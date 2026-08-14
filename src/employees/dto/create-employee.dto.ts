import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateEmployeeDto {
  @ApiProperty({ example: 'EMP-1001' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(50)
  employeeCode: string;

  @ApiProperty({ example: 'Jane' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  firstName: string;

  @ApiProperty({ example: 'Doe' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  lastName: string;

  @ApiProperty({ example: 'jane.doe@company.com' })
  @IsNotEmpty()
  @IsEmail()
  @MaxLength(255)
  email: string;

  @ApiProperty({ example: 'Engineering' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  department: string;
}
