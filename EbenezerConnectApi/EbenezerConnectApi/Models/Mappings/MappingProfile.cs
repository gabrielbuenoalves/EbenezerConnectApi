using AutoMapper;
using EbenezerConnectApi.Models.Entities;
using EbenezerConnectApi.Models.Dtos;

namespace EbenezerConnectApi.Models.Mappings
{
    public class MappingProfile : Profile
    {
        public MappingProfile()
        {
            // Cadastro → Pessoa
            CreateMap<RegisterRequestDto, Pessoa>()
                .ForMember(dest => dest.SenhaHash, opt => opt.Ignore()); // A senha será setada manualmente com hash

            // Pessoa → DTO de resposta
            CreateMap<Pessoa, PessoaResponseDto>()
                .ForMember(dest => dest.QuartoNome, opt => opt.MapFrom(src => src.Quarto != null ? src.Quarto.Nome : null));

            // Atualização de dados
            CreateMap<AtualizarPessoaDto, Pessoa>();

            // Pessoa → LoginResponse
            CreateMap<Pessoa, LoginResponseDto>();

            //Criar Produto -> ProdutoEstoque
            CreateMap<CreateProductDto, ProdutoEstoque>()
                .ForMember(dest => dest.QuantidadeEmEstoque, opt => opt.MapFrom(src => src.QuantidadeEstoque))
                .ForMember(dest => dest.PrecoCompraAtual, opt => opt.MapFrom(src => src.PrecoCompra))
                .ForMember(dest => dest.PrecoVendaAtual, opt => opt.MapFrom(src => src.PrecoVenda))
                .ForMember(dest => dest.HistoricoPrecos, opt => opt.Ignore()); // Ignora para evitar problemas

            CreateMap<ProdutoEstoque, ExibirProdutoDto>()
                .ForMember(dest => dest.QuantidadeEmEstoque, opt => opt.MapFrom(src => src.QuantidadeEmEstoque))
                .ForMember(dest => dest.PrecoCompraAtual, opt => opt.MapFrom(src => src.PrecoCompraAtual))
                .ForMember(dest => dest.PrecoVendaAtual, opt => opt.MapFrom(src => src.PrecoVendaAtual));

        }
    }
}

