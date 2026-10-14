import { BadRequestException } from '@nestjs/common';
import { ProjetoPeriodoService } from './projeto-periodo.service';

describe('ProjetoPeriodoService', () => {
  const timeZoneOriginal = process.env.PROJETOS_TIMEZONE;

  afterEach(() => {
    if (timeZoneOriginal === undefined) delete process.env.PROJETOS_TIMEZONE;
    else process.env.PROJETOS_TIMEZONE = timeZoneOriginal;
  });

  const servicoNoFuso = (timeZone?: string) => {
    if (timeZone === undefined) delete process.env.PROJETOS_TIMEZONE;
    else process.env.PROJETOS_TIMEZONE = timeZone;
    return new ProjetoPeriodoService();
  };

  it('calcula o dia de hoje no fuso operacional, nao no relogio UTC', () => {
    const service = servicoNoFuso();

    expect(service.hojeOperacional(new Date('2026-10-11T02:30:00.000Z'))).toBe('2026-10-10');
    expect(service.hojeOperacional(new Date('2026-10-11T03:00:00.000Z'))).toBe('2026-10-11');
  });

  it('aceita a data de hoje e rejeita o dia seguinte na virada do dia em Sao Paulo', () => {
    const service = servicoNoFuso();
    const agora = new Date('2026-10-11T02:30:00.000Z');

    expect(service.assertDataTrabalho('2026-10-10', agora)).toEqual(new Date('2026-10-10T00:00:00.000Z'));
    expect(() => service.assertDataTrabalho('2026-10-11', agora)).toThrow(
      new BadRequestException('A data do apontamento não pode ser posterior a hoje.')
    );
  });

  it('rejeita data ausente ou fora do formato de calendario', () => {
    const service = servicoNoFuso();

    expect(() => service.assertDataTrabalho('')).toThrow('Informe a data do apontamento.');
    expect(() => service.assertDataTrabalho('10/10/2026')).toThrow('YYYY-MM-DD');
    expect(() => service.assertDataTrabalho('2026-02-30')).toThrow(BadRequestException);
  });

  it('devolve a meia-noite seguinte do fuso como fim do dia', () => {
    const service = servicoNoFuso();

    expect(service.fimDoDiaOperacional('2026-10-10')).toEqual(new Date('2026-10-11T03:00:00.000Z'));
    expect(service.fimDoDiaOperacional('2026-12-31')).toEqual(new Date('2027-01-01T03:00:00.000Z'));
  });

  it('respeita o fuso configurado, inclusive na mudanca de horario de verao', () => {
    const service = servicoNoFuso('America/New_York');

    expect(service.fimDoDiaOperacional('2026-03-07')).toEqual(new Date('2026-03-08T05:00:00.000Z'));
    expect(service.fimDoDiaOperacional('2026-03-08')).toEqual(new Date('2026-03-09T04:00:00.000Z'));
    expect(servicoNoFuso('Asia/Tokyo').fimDoDiaOperacional('2026-10-10')).toEqual(new Date('2026-10-10T15:00:00.000Z'));
  });

  it('valida a competencia no formato YYYY-MM e deriva a competencia da data', () => {
    const service = servicoNoFuso();

    expect(service.normalizeCompetencia(' 2026-10 ')).toBe('2026-10');
    expect(() => service.normalizeCompetencia('2026-13')).toThrow('A competência deve usar o formato YYYY-MM.');
    expect(() => service.normalizeCompetencia('2026-1')).toThrow(BadRequestException);
    expect(service.competenciaDaData(new Date('2026-10-31T00:00:00.000Z'))).toBe('2026-10');
  });

  it('deriva a competencia de hoje no fuso operacional e os limites de cada competencia', () => {
    const service = servicoNoFuso();

    expect(service.competenciaAtual(new Date('2026-10-01T02:30:00.000Z'))).toBe('2026-09');
    expect(service.competenciaAtual(new Date('2026-10-01T03:00:00.000Z'))).toBe('2026-10');
    expect(service.limitesDaCompetencia('2026-12')).toEqual({
      inicio: new Date('2026-12-01T00:00:00.000Z'),
      fimExclusivo: new Date('2027-01-01T00:00:00.000Z')
    });
    expect(() => service.limitesDaCompetencia('2026-00')).toThrow('A competência deve usar o formato YYYY-MM.');
  });

  it('lista as competencias alcancadas pelo periodo, inclusive na virada do ano', () => {
    const service = servicoNoFuso();
    const dia = (valor: string) => new Date(`${valor}T00:00:00.000Z`);

    expect(service.competenciasDoPeriodo(dia('2026-11-29'), dia('2027-02-01'))).toEqual(['2026-11', '2026-12', '2027-01', '2027-02']);
    expect(service.competenciasDoPeriodo(dia('2026-09-15'), dia('2026-09-15'))).toEqual(['2026-09']);
  });

  it('exige os dois dias do periodo de consulta, em ordem e com no maximo 366 dias', () => {
    const service = servicoNoFuso();

    expect(service.periodoDeConsulta('2026-01-01', '2027-01-01')).toEqual({
      inicio: new Date('2026-01-01T00:00:00.000Z'),
      fim: new Date('2027-01-01T00:00:00.000Z')
    });
    expect(() => service.periodoDeConsulta('', '2026-09-30')).toThrow(new BadRequestException('Informe o primeiro e o último dia do período.'));
    expect(() => service.periodoDeConsulta('2026-09-30', '2026-09-01')).toThrow('A data final nao pode ser anterior a data inicial.');
    expect(() => service.periodoDeConsulta('2026-01-01', '2027-01-02')).toThrow(new BadRequestException('Consulte no máximo 366 dias por vez.'));
  });
});
