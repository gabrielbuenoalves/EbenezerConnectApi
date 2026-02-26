export interface FinanceiroItem {
  produtoNome: string;
  quantidade: number;
  precoUnitario: number;
}

export interface FinanceiroHistorico {
  id: number;
  tipo: 'cantina' | 'saldo';
  data: string;
  pessoaId: number;
  pessoaNome: string;
  valor: number;
  pagamento: string;
  revertida: boolean;
  dataReversao?: string | null;
  itens?: FinanceiroItem[] | null;
}

export interface ReverterFinanceiroDto {
  id: number;
  tipo: 'cantina' | 'saldo';
  motivo?: string;
}
