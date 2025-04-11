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
        }
    }
}

