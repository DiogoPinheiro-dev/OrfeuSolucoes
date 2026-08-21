import { Injectable } from '@nestjs/common';
import { JwtPayload } from '../auth/strategies/jwt-payload.type';
import { assertSystemAdmin } from '../users/policies/user.policy';
import { CreateServicoInput } from './dto/create-servico.input';
import { ServicoType } from './dto/servico.type';
import { UpdateServicoInput } from './dto/update-servico.input';
import { ServicoCatalogService } from './servico-catalog.service';

@Injectable()
export class ServicosService {
  constructor(private readonly servicoCatalog: ServicoCatalogService) {}

  create(input: CreateServicoInput): Promise<ServicoType> {
    return this.servicoCatalog.create(input);
  }

  createAsAdmin(input: CreateServicoInput, admin: JwtPayload): Promise<ServicoType> {
    assertSystemAdmin(admin);
    return this.servicoCatalog.create(input);
  }

  findAll(): Promise<ServicoType[]> {
    return this.servicoCatalog.findAll();
  }

  findAllAsAdmin(admin: JwtPayload): Promise<ServicoType[]> {
    assertSystemAdmin(admin);
    return this.servicoCatalog.findAll();
  }

  update(input: UpdateServicoInput): Promise<ServicoType> {
    return this.servicoCatalog.update(input);
  }

  updateAsAdmin(input: UpdateServicoInput, admin: JwtPayload): Promise<ServicoType> {
    assertSystemAdmin(admin);
    return this.servicoCatalog.update(input);
  }

  remove(id: number): Promise<boolean> {
    return this.servicoCatalog.remove(id);
  }

  removeAsAdmin(id: number, admin: JwtPayload): Promise<boolean> {
    assertSystemAdmin(admin);
    return this.servicoCatalog.remove(id);
  }
}
