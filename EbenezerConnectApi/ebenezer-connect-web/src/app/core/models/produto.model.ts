export interface Produto {
  id: number;
  nome: string;
  quantidadeEmEstoque: number;
  precoCompraAtual: number;
  precoVendaAtual: number;
}

export interface CriarProdutoDto {
  nome: string;
  quantidadeEstoque: number;
  precoCompra: number;
  precoVenda: number;
}

export interface AtualizarProdutoDto {
  nome?: string;
  quantidadeEstoque?: number;
  precoCompra?: number;
  precoVenda?: number;
}
