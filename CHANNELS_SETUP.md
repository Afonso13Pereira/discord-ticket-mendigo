# Configuração dos Canais de Suporte

## Novos Canais Implementados

O sistema agora separa os diferentes tipos de suporte em canais específicos para melhor organização:

### Canais Obrigatórios (adicionar ao .env):

```env
# Canais de Suporte Especializado
ERROS_CHANNEL_ID=1234567890123456789          # Erros do sistema, logs do Discord
REDEEMS_CHANNEL_ID=1234567890123456789        # Pedidos de redeems do website
AJUDAS_CHANNEL_ID=1234567890123456789         # Dúvidas, bugs do website, suporte geral
GIVEAWAYSHELP_CHANNEL_ID=1234567890123456789  # Ajuda com giveaways, códigos duplicados
OTHER_CHANNEL_ID=1234567890123456789          # Tudo o resto (revisões, suporte geral)

# Canais Existentes (manter)
LOGS_CHANNEL_ID=1234567890123456789
TRANSCRIPTS_CHANNEL_ID=1234567890123456789
MOD_CHANNEL_ID=1234567890123456789
APROVE_CHANNEL_ID=1234567890123456789
STATS_CHANNEL_ID=1234567890123456789
CREATETICKET_CHANNEL_ID=1234567890123456789
```

### Canais Removidos:

```env
# REMOVER esta linha do .env:
STAFF_CHANNEL_ID=1386488826024693770
```

## Distribuição dos Tipos de Suporte:

### 🚨 ERROS_CHANNEL_ID
- Erros críticos do sistema
- Erros de comandos
- Erros de eventos
- Avisos do sistema
- Logs de monitorização

### 🎁 REDEEMS_CHANNEL_ID
- Pedidos de redeems do website
- Seleção de itens para resgate
- Notificações de redeems completados

### ❓ AJUDAS_CHANNEL_ID
- Bugs reportados no website
- Dúvidas gerais
- Descrições de problemas
- Suporte técnico

### 🎰 GIVEAWAYSHELP_CHANNEL_ID
- Códigos Telegram duplicados
- Ajuda com giveaways
- Problemas específicos de giveaways
- Verificações de códigos

### 📋 OTHER_CHANNEL_ID
- Revisões de aprovações
- Pedidos de suporte geral
- Informações do sistema
- Tudo o resto que não se encaixa nos outros canais

## Como Configurar:

1. **Criar os canais no Discord** com os nomes apropriados
2. **Copiar os IDs** dos canais criados
3. **Adicionar ao arquivo .env** com os IDs corretos
4. **Remover a linha** `STAFF_CHANNEL_ID` do .env
5. **Verificar a configuração** executando: `node check-channels.js`
6. **Reiniciar o bot** para aplicar as mudanças

## Verificação da Configuração:

Execute o script de verificação para confirmar que todos os canais estão configurados corretamente:

```bash
node check-channels.js
```

Este script irá:
- ✅ Verificar se todos os canais existem
- ✅ Confirmar se os IDs estão corretos
- ❌ Mostrar quais canais estão faltando
- 💡 Dar instruções para corrigir problemas

## Exemplo de Configuração:

```env
# Canais de Suporte
ERROS_CHANNEL_ID=1234567890123456789
REDEEMS_CHANNEL_ID=2345678901234567890
AJUDAS_CHANNEL_ID=3456789012345678901
GIVEAWAYSHELP_CHANNEL_ID=4567890123456789012
OTHER_CHANNEL_ID=5678901234567890123

# Outros Canais
LOGS_CHANNEL_ID=6789012345678901234
TRANSCRIPTS_CHANNEL_ID=7890123456789012345
MOD_CHANNEL_ID=8901234567890123456
APROVE_CHANNEL_ID=9012345678901234567
STATS_CHANNEL_ID=0123456789012345678
CREATETICKET_CHANNEL_ID=1234567890123456789
```

## Benefícios:

- ✅ **Melhor organização** dos pedidos de suporte
- ✅ **Resposta mais rápida** para cada tipo de problema
- ✅ **Equipa especializada** pode focar no seu domínio
- ✅ **Menos confusão** nos canais de suporte
- ✅ **Tracking mais fácil** de diferentes tipos de pedidos 