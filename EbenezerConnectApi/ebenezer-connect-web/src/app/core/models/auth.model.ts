export interface LoginRequest {
  email: string;
  senha: string;
}

export interface LoginResponse {
  id: number;
  nome: string;
  email: string;
  funcao: string;
  token: string;
}

export interface RegisterRequest {
  nome: string;
  cpf: string;
  email: string;
  senha: string;
  confirmarSenha: string;
  funcao: string;
  igreja?: string;
}

export interface RedefinirSenhaDto {
  email: string;
  senhaTemporaria: string;
  novaSenha: string;
}

export interface User {
  id: number;
  nome: string;
  email: string;
  funcao: string;
}
