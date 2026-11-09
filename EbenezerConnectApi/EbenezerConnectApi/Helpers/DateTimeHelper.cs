namespace EbenezerConnectApi.Helpers
{
    public static class DateTimeHelper
    {
        private static readonly TimeZoneInfo BrasiliaTimeZone = ResolverFusoBrasilia();

        private static TimeZoneInfo ResolverFusoBrasilia()
        {
            try
            {
                return TimeZoneInfo.FindSystemTimeZoneById("E. South America Standard Time");
            }
            catch (TimeZoneNotFoundException)
            {
                return TimeZoneInfo.FindSystemTimeZoneById("America/Sao_Paulo");
            }
        }

        /// <summary>
        /// Retorna a data/hora atual no horário de Brasília (Brasil)
        /// </summary>
        public static DateTime NowBrasilia()
        {
            return TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, BrasiliaTimeZone);
        }

        /// <summary>
        /// Converte uma data UTC para o horário de Brasília
        /// </summary>
        public static DateTime ToBrasilia(DateTime utcDateTime)
        {
            if (utcDateTime.Kind != DateTimeKind.Utc)
            {
                utcDateTime = DateTime.SpecifyKind(utcDateTime, DateTimeKind.Utc);
            }
            return TimeZoneInfo.ConvertTimeFromUtc(utcDateTime, BrasiliaTimeZone);
        }
    }
}
