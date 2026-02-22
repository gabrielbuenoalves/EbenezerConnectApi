export interface Pessoa {
  id: number;
  nome: string;
  email: string;
  funcao: 'acampante' | 'conselheiro' | 'admin';
  cpf: string;
  igreja?: string;
  saldo: number;
  quartoNome?: string;
}

export interface AtualizarPessoaDto {
  nome: string;
  igreja?: string;
  quartoId?: number;
}

export interface AdicionarCreditoDto {
  pessoaId: number;
  valor: number;
}
