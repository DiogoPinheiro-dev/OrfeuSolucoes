import { assertSafeBufferedUpload, isDeclaredUploadTypeAllowed } from './safe-upload.util';

describe('safe upload', () => {
  it('exige correspondencia entre extensao e MIME', () => {
    expect(isDeclaredUploadTypeAllowed('foto.jpg', 'image/jpeg')).toBe(true);
    expect(isDeclaredUploadTypeAllowed('foto.jpg', 'image/png')).toBe(false);
  });

  it('aceita assinaturas validas de texto, imagem, PDF e DOCX', () => {
    const files = [
      { originalname: 'nota.txt', mimetype: 'text/plain', buffer: Buffer.from('conteudo seguro') },
      { originalname: 'foto.jpg', mimetype: 'image/jpeg', buffer: Buffer.from([0xff, 0xd8, 0xff, 0x00]) },
      { originalname: 'foto.png', mimetype: 'image/png', buffer: Buffer.from([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a]) },
      { originalname: 'arquivo.pdf', mimetype: 'application/pdf', buffer: Buffer.from('%PDF-1.7') },
      { originalname: 'arquivo.docx', mimetype: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', buffer: Buffer.concat([Buffer.from([0x50,0x4b,0x03,0x04]), Buffer.from('[Content_Types].xml word/document.xml')]) }
    ];

    files.forEach((file) => expect(() => assertSafeBufferedUpload({ ...file, size: file.buffer.length }, 1024)).not.toThrow());
  });

  it('rejeita nome inseguro, assinatura falsa e tamanho inconsistente', () => {
    expect(() => assertSafeBufferedUpload({ originalname: '../nota.txt', mimetype: 'text/plain', buffer: Buffer.from('x'), size: 1 }, 1024)).toThrow('Nome de arquivo invalido');
    expect(() => assertSafeBufferedUpload({ originalname: 'falso.pdf', mimetype: 'application/pdf', buffer: Buffer.from('texto'), size: 5 }, 1024)).toThrow('Tipo de arquivo nao permitido');
    expect(() => assertSafeBufferedUpload({ originalname: 'nota.txt', mimetype: 'text/plain', buffer: Buffer.from('texto'), size: 4 }, 1024)).toThrow('Arquivo de anexo vazio ou invalido');
  });
});
