import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Employee } from './entities/employee.entity';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { EmployeeQueryDto } from './dto/employee-query.dto';
import { PaginatedResultDto } from '../common/dto/pagination-query.dto';

@Injectable()
export class EmployeesService {
  constructor(
    @InjectRepository(Employee)
    private readonly employeeRepository: Repository<Employee>,
  ) {}

  async create(dto: CreateEmployeeDto): Promise<Employee> {
    await this.ensureUnique(dto.employeeCode, dto.email);
    const employee = this.employeeRepository.create(dto);
    return this.employeeRepository.save(employee);
  }

  async findAll(query: EmployeeQueryDto): Promise<PaginatedResultDto<Employee>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;

    const qb = this.employeeRepository.createQueryBuilder('employee');

    if (query.department) {
      qb.andWhere('employee.department = :department', {
        department: query.department,
      });
    }

    if (query.search) {
      qb.andWhere(
        '(employee.firstName ILIKE :search OR employee.lastName ILIKE :search OR employee.email ILIKE :search OR employee.employeeCode ILIKE :search)',
        { search: `%${query.search}%` },
      );
    }

    qb.orderBy('employee.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [data, total] = await qb.getManyAndCount();
    return new PaginatedResultDto(data, total, page, limit);
  }

  async findOne(id: string): Promise<Employee> {
    const employee = await this.employeeRepository.findOne({ where: { id } });
    if (!employee) {
      throw new NotFoundException(`Employee with id ${id} not found`);
    }
    return employee;
  }

  async update(id: string, dto: UpdateEmployeeDto): Promise<Employee> {
    const employee = await this.findOne(id);
    if (dto.employeeCode || dto.email) {
      await this.ensureUnique(dto.employeeCode, dto.email, id);
    }
    Object.assign(employee, dto);
    return this.employeeRepository.save(employee);
  }

  async remove(id: string): Promise<void> {
    const employee = await this.findOne(id);
    await this.employeeRepository.softRemove(employee);
  }

  private async ensureUnique(
    employeeCode?: string,
    email?: string,
    excludeId?: string,
  ): Promise<void> {
    if (employeeCode) {
      const existing = await this.employeeRepository.findOne({
        where: { employeeCode },
      });
      if (existing && existing.id !== excludeId) {
        throw new ConflictException(
          `Employee code ${employeeCode} is already in use`,
        );
      }
    }
    if (email) {
      const existing = await this.employeeRepository.findOne({ where: { email } });
      if (existing && existing.id !== excludeId) {
        throw new ConflictException(`Email ${email} is already in use`);
      }
    }
  }
}
