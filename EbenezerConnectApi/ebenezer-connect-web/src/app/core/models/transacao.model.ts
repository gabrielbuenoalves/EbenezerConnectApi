export interface ItemTransacaoDto {
  produtoId: number;
  quantidade: number;
}

export interface RegistrarTransacaoDto {
  pessoaId: number;
  tipoPagamento: 'saldo' | 'avista';
  itens: ItemTransacaoDto[];
}

export interface TransacaoCantina {
  id: number;
  pessoaId: number;
  dataTransacao: Date;
  valor: number;
  tipo: string;
  itens: ItemTransacao[];
}

export interface ItemTransacao {
  id: number;
  produtoId: number;
  produtoNome?: string;
  quantidade: number;
  precoVendaUnitario: number;
  precoCompraUnitario: number;
  lucroItem: number;
}
