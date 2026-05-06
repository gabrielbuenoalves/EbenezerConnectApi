-- Manual schema fix for Escalas
-- Run this only if the production database does not already have these tables.
-- Example: mysql -u USER -p -e "source sql/manual-create-escalas.sql" DATABASE

CREATE TABLE IF NOT EXISTS `EscalaEvento` (
  `Id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `Nome` VARCHAR(200) NOT NULL,
  `DataInicio` DATETIME NULL,
  `DataFim` DATETIME NULL,
  `Ativo` TINYINT(1) NOT NULL DEFAULT 1,
  `CriadoEm` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `EscalaEntrada` (
  `Id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `EscalaEventoId` INT NOT NULL,
  `Dia` VARCHAR(20) NOT NULL,
  `HorarioInicio` VARCHAR(10) NOT NULL,
  `HorarioFim` VARCHAR(10) NOT NULL,
  `Atividade` VARCHAR(150) NOT NULL,
  `CapacidadeMaxima` INT NULL,
  `NomeConselheiro` VARCHAR(100) NOT NULL,
  `Destaque` TINYINT(1) NOT NULL DEFAULT 0,
  CONSTRAINT `FK_EscalaEntrada_EscalaEvento` 
    FOREIGN KEY (`EscalaEventoId`) REFERENCES `EscalaEvento` (`Id`) ON DELETE CASCADE
) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
