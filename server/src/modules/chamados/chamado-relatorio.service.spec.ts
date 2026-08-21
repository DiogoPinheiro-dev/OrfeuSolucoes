import { Workbook } from 'exceljs';
import { ChamadoRelatorioService } from './chamado-relatorio.service';

describe('ChamadoRelatorioService', () => {
  const row = { id:'c1', numero:12, titulo:'Falha de acesso', status:'RESOLVIDO', slaStatus:'NO_PRAZO', criadoEm:new Date('2026-07-01T10:00:00Z'), primeiraRespostaEm:new Date('2026-07-01T10:30:00Z'), resolvidoEm:new Date('2026-07-01T12:00:00Z'), prioridadeConfiguracao:{nome:'Alta'}, categoria:{nome:'Acesso'}, solicitante:{nome:'Cliente'}, responsavel:{nome:'Ana'}, liderAtendimento:null };
  const world = () => { const findMany=jest.fn().mockResolvedValue([row]); const count=jest.fn().mockResolvedValue(1); const authorization={assertCompanyContext:jest.fn().mockReturnValue(9),assertFeatureAction:jest.fn().mockResolvedValue(undefined)}; return { service:new ChamadoRelatorioService({chamado:{findMany,count}} as any,authorization as any),findMany,count,authorization }; };
  it('filtra por empresa e campos operacionais e pagina o resultado', async () => { const {service,findMany}=world(); const result=await service.listar({criadoDe:'2026-07-01',criadoAte:'2026-07-31',responsavelId:'11111111-1111-1111-1111-111111111111',categoriaId:2,prioridadeId:3,slaStatus:'NO_PRAZO',status:'RESOLVIDO',page:2,pageSize:25} as any,{empresaId:9} as any); expect(findMany).toHaveBeenCalledWith(expect.objectContaining({where:expect.objectContaining({empresaId:9,categoriaId:2,prioridadeId:3,slaStatus:'NO_PRAZO',status:'RESOLVIDO'}),skip:25,take:25})); expect(result.items[0]).toMatchObject({numero:12,atendente:'Ana',tempoPrimeiraRespostaMinutos:30,tempoResolucaoMinutos:120}); });
  it('gera CSV UTF-8 e XLSX real', async () => { const {service}=world(); const csv=await service.exportar({},'csv',{empresaId:9} as any); expect(csv.buffer.subarray(0,3)).toEqual(Buffer.from([0xef,0xbb,0xbf])); expect(csv.buffer.toString()).toContain('Falha de acesso'); const xlsx=await service.exportar({},'xlsx',{empresaId:9} as any); expect(xlsx.mimeType).toContain('spreadsheetml'); expect(xlsx.buffer.subarray(0,2).toString()).toBe('PK'); });

  it('neutraliza formulas controladas por usuario no CSV e no XLSX', async () => {
    const maliciousRow = {
      ...row,
      titulo: '=HYPERLINK("https://hostil.test")',
      solicitante: { nome: '@SUM(1+1)' }
    };
    const findMany = jest.fn().mockResolvedValue([maliciousRow]);
    const authorization = {
      assertCompanyContext: jest.fn().mockReturnValue(9),
      assertFeatureAction: jest.fn().mockResolvedValue(undefined)
    };
    const service = new ChamadoRelatorioService({ chamado: { findMany } } as any, authorization as any);

    const csv = await service.exportar({}, 'csv', { empresaId: 9 } as any);
    const csvText = csv.buffer.toString('utf8');
    expect(csvText).toContain("'=HYPERLINK(");
    expect(csvText).toContain("'@SUM(1+1)");

    const xlsx = await service.exportar({}, 'xlsx', { empresaId: 9 } as any);
    const workbook = new Workbook();
    await workbook.xlsx.load(xlsx.buffer as never);
    expect(workbook.getWorksheet('Chamados')?.getCell('B2').value).toBe("'=HYPERLINK(\"https://hostil.test\")");
    expect(workbook.getWorksheet('Chamados')?.getCell('G2').value).toBe("'@SUM(1+1)");
  });
});
