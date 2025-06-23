# 🔧 CONFIGURAÇÕES DE FALLBACK - SISTEMA CPA

## 📊 VALORES CPA PADRÃO (Fallback)
```typescript
const DEFAULT_CPA_VALUES = {
  level_1: 50.00,  // R$ 50,00 - Afiliado direto
  level_2: 20.00,  // R$ 20,00 - Nível 2
  level_3: 5.00,   // R$ 5,00  - Nível 3
  level_4: 5.00,   // R$ 5,00  - Nível 4
  level_5: 5.00    // R$ 5,00  - Nível 5
};
```

## 🔄 CONFIGURAÇÕES DE RETRY
- **Tentativas:** 3
- **Delay inicial:** 1 segundo
- **Backoff:** Exponencial (1s, 2s, 4s)
- **Timeout:** 30 segundos (geral), 5 segundos (health check)

## 💾 CONFIGURAÇÕES DE CACHE
- **Timeout:** 5 minutos
- **Chaves:** `cpa_config_configuration`, `cpa_config_validation`
- **Limpeza:** Automática por timestamp

## ⚠️ ESTRATÉGIAS DE FALLBACK

### 1. Config Service Indisponível
- ✅ Usar valores padrão do cache
- ✅ Usar configurações hardcoded
- ✅ Log detalhado do erro

### 2. Validação CPA Falha
- ✅ Usar lógica simples (affiliate_id % 3 === 0)
- ✅ Simular dados de jogador
- ✅ Manter funcionalidade básica

### 3. Timeout de Rede
- ✅ Retry automático com backoff
- ✅ Timeout reduzido para health checks
- ✅ Logs de cada tentativa

## 🎯 MÉTRICAS DE RESILIÊNCIA

### Implementado
- ✅ Cache local (5 min)
- ✅ Retry com backoff exponencial
- ✅ Fallbacks para todos os métodos
- ✅ Logs detalhados de erro
- ✅ Timeout configurável

### Próximos Passos
- [ ] Métricas de performance
- [ ] Alertas de falha
- [ ] Dashboard de saúde dos serviços
- [ ] Fallback para dados históricos

---

**Objetivo:** Garantir que o sistema CPA funcione mesmo com falhas nos microserviços Railway.

