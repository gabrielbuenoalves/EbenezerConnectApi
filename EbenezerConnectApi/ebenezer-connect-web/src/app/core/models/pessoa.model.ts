export interface Pessoa {
  id: number;
  nome: string;
  email: string;
  funcao: 'acampante' | 'conselheiro' | 'admin';
  cpf: string;
  saldo: number;
  quartoNome?: string;
}

export interface AtualizarPessoaDto {
  nome: string;
  quartoId?: number;
  email?: string;
  cpf?: string;
  funcao?: string;
}

export interface AdicionarCreditoDto {
  pessoaId: number;
  valor: number;
}
