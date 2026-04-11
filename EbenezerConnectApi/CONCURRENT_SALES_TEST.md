# Teste de Vendas Concorrentes - Race Condition Fix

## O Problema (Antes)
```csharp
// ❌ VULNERÁVEL: Dois usuários lêem o mesmo estoque
var produto = await _context.Produto.FindAsync(id);  // T1: 10 unidades
                                                      // T2: 10 unidades (RACE!)
if (produto.QuantidadeEmEstoque < quantidade)        // Ambos OK
    return false;

produto.QuantidadeEmEstoque -= quantidade;           // T1: 10 - 8 = 2
                                                      // T2: 10 - 5 = 5
await _context.SaveChangesAsync();                   // T2 sobrescreve T1!
```

**Resultado:** Vendeu 13 unidades, estoque marca 5. Data inconsistente!

---

## A Solução (Depois)
```csharp
// ✅ SEGURO: Transação SERIALIZABLE garante isolamento
using var transaction = await _context.Database.BeginTransactionAsync(
    IsolationLevel.Serializable  // Máximo isolamento
);

try
{
    // Dentro da transação, nenhum outro thread consegue ler/modificar estes dados
    var produto1 = await _context.Produto.FindAsync(id);
    
    if (produto1.QuantidadeEmEstoque < quantidade1)
        return (false, "Sem estoque");
    
    produto1.QuantidadeEmEstoque -= quantidade1;
    await _context.SaveChangesAsync();
    await transaction.CommitAsync();  // Só commita se passou todas as validações
}
catch
{
    await transaction.RollbackAsync();  // Desfaz tudo se falhar
}
```

**Resultado:** Uma compra sucede (estoque 2), outra falha (estoque insuficiente). Dados consistentes!

---

## Como Testar Localmente

### 1. Preparar o Ambiente
```bash
# No seu PC (não na AWS)
cd /Users/gabrielbuenoalves/Desktop/repos/EbenezerConnectApi/EbenezerConnectApi
dotnet build
```

### 2. Script de Teste Concurrent (PowerShell - Windows ou pwsh - Mac)
```powershell
# Substitua pelos seus valores reais
$baseUrl = "http://localhost:5000"  # ou seu IP da AWS
$productId = 1
$userId1 = 2
$userId2 = 3
$token1 = "seu_token_aqui"  # Obter via /auth/login
$token2 = "seu_outro_token"

# Função auxiliar
function AddToCart {
    param($token, $userId, $productId, $quantity)
    $headers = @{ "Authorization" = "Bearer $token" }
    $body = @{
        PessoaId = $userId
        TipoPagamento = "avista"
        Itens = @(@{ 
            ProdutoId = $productId
            Quantidade = $quantity
        })
    } | ConvertTo-Json
    
    return Invoke-RestMethod -Uri "$baseUrl/api/transacaocantina/registrar" `
        -Method POST `
        -Headers $headers `
        -Body $body `
        -ContentType "application/json"
}

# **TESTE: Dois usuários compram simultaneamente do mesmo produto (com estoque limitado)
# Produto tem 10 unidades, usuário 1 quer 8, usuário 2 quer 5

$job1 = Start-Job { AddToCart -token $token1 -userId $userId1 -productId $productId -quantity 8 }
$job2 = Start-Job { AddToCart -token $token2 -userId $userId2 -productId $productId -quantity 5 }

# Aguardar ambas
$result1 = Wait-Job $job1 | Receive-Job
$result2 = Wait-Job $job2 | Receive-Job

Write-Host "Resultado Usuário 1 (compra 8): $($result1 | ConvertTo-Json)"
Write-Host "Resultado Usuário 2 (compra 5): $($result2 | ConvertTo-Json)"

# Verificar estoque final
$product = Invoke-RestMethod -Uri "$baseUrl/api/produto/$productId" -Method GET
Write-Host "Estoque Final: $($product.QuantidadeEmEstoque)"
```

### 3. Script de Teste Python (Multiplataforma)
```python
import asyncio
import aiohttp
import json

BASE_URL = "http://localhost:5000"
PRODUCT_ID = 1
USER_ID_1 = 2
USER_ID_2 = 3

async def make_sale(session, token, user_id, product_id, quantity):
    headers = {"Authorization": f"Bearer {token}"}
    payload = {
        "PessoaId": user_id,
        "TipoPagamento": "avista",
        "Itens": [{"ProdutoId": product_id, "Quantidade": quantity}]
    }
    
    async with session.post(
        f"{BASE_URL}/api/transacaocantina/registrar",
        headers=headers,
        json=payload
    ) as resp:
        return await resp.json(), resp.status

async def test_concurrent_sales(token1, token2):
    connector = aiohttp.TCPConnector(limit=10)
    async with aiohttp.ClientSession(connector=connector) as session:
        # Vendas simultâneas
        task1 = make_sale(session, token1, USER_ID_1, PRODUCT_ID, 8)
        task2 = make_sale(session, token2, USER_ID_2, PRODUCT_ID, 5)
        
        print("🔄 Iniciando vendas simultâneas...")
        result1, status1 = await asyncio.gather(*[task1, task2])[0], await asyncio.gather(*[task1, task2])[1]
        result2, status2 = await asyncio.gather(*[task1, task2])[0], await asyncio.gather(*[task1, task2])[1]
        
        print(f"\n✅ Venda 1 (8 unidades): Status {status1} - {result1}")
        print(f"✅ Venda 2 (5 unidades): Status {status2} - {result2}")
        
        # Verificar estoque
        async with session.get(f"{BASE_URL}/api/produto/{PRODUCT_ID}") as resp:
            product = await resp.json()
            print(f"\n📦 Estoque Final: {product['QuantidadeEmEstoque']}")
            
            if product['QuantidadeEmEstoque'] == 10:  # Nenhuma compra sucedeu
                print("   ⚠️ Ambas falharam (possível timeout)")
            elif product['QuantidadeEmEstoque'] == 2:  # Apenas a primeira sucedeu
                print("   ✅ Uma compra sucedeu, outra falhou (correto!)")
            elif product['QuantidadeEmEstoque'] == 5:  # Apenas a segunda sucedeu
                print("   ✅ Uma compra sucedeu, outra falhou (correto!)")
            else:
                print("   🐛 Resultado inesperado - estoque inconsistente!")

# Usar assim:
# asyncio.run(test_concurrent_sales(token1, token2))
```

---

## Resultados Esperados

### ✅ COM a correção (Isolamento Serializable):

**Estoque Inicial:** 10 unidades

| Tempo | Evento | Status |
|------|--------|--------|
| T1 | Usuário 1 inicia transação | ✅ |
| T1 | Usuário 1 valida estoque (10 >= 8) | ✅ |
| T1 | Usuário 1 diminui para 2 | ✅ |
| T1 | Usuário 2 tenta INICIAR (BLOQUEADO pela transação de U1) | ⏳ |
| T2 | Usuário 1 commita | ✅ |
| **Estoque:** **2** (correto!) | | |
| T3 | Usuário 2 agora consegue ler (2 disponíveis) | ✅ |
| T3 | Usuário 2 valida (2 >= 5) | ❌ FALHA |
| **Resultado:** Venda 1 OK (8 unidades), Venda 2 Falha (estoque insuficiente) | | ✅ CORRETO |

### ❌ SEM a correção (antes):

**Estoque Inicial:** 10 unidades

| Tempo | Evento | Dados |
|------|--------|-------|
| T1 | U1 lê estoque | 10 ✓ |
| **T1** | **U2 lê estoque** | **10** ✓ (RACE CONDITION!) |
| T2 | U1 valida (10 >= 8) | ✓ |
| T2 | U2 valida (10 >= 5) | ✓ |
| T3 | U1 atualiza: 10 - 8 = 2 | - |
| T3 | U2 atualiza: 10 - 5 = 5 | ❌ **SOBRESCREVE!** |
| **Resultado:** Vendeu 13, estoque=5 (INCONSISTENTE!) | | ⚠️ BUG |

---

## Quando Fazer Deploy

1. Teste localmente com o script acima
2. Commit e push da mudança
3. Deploy normal na AWS:
   ```bash
   docker compose -f docker-compose.prod.yml --env-file .env up -d --force-recreate api
   ```

4. Teste novamente em produção (se possível com múltiplos usuários reais)

---

## Performance

⚠️ **IsolationLevel.Serializable pode ser mais lento**, especialmente sob alta concorrência.

Se isso virar problema:
- Monitor: `docker logs ebenezer-api | grep -i "serializable\|lock\|timeout"`
- Ajuste timeout da transação em `appsettings.Production.json`
- Considerar sharding por produto ou queue de vendas em alta escala

Para agora: **Corrição é essencial, performance é secundária.**
