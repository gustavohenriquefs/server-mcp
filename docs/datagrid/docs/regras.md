# Data Grid - Regras de Design

## 🎯 Regras Principais

### 1. Alinhamento de Colunas Numéricas

**Regra:** Todas as colunas que contenham valores numéricos devem ter alinhamento centralizado.

```css
.data-grid th.numeric,
.data-grid td.numeric {
  text-align: center;
}
```

**Aplicação:**
- Valores monetários (R$ 1.250,00)
- Percentuais (85%)
- Quantidades (142)
- Identificadores numéricos

### 2. Espaçamento entre Grupos de Botões

**Regra:** O espaçamento entre grupos de botões deve ser exatamente **8px**.

```css
.button-group {
  margin-right: 8px;
}

.button-group:last-child {
  margin-right: 0;
}
```

**Estrutura HTML:**
```html
<div class="actions">
  <!-- Grupo 1: Ações principais -->
  <div class="button-group">
    <button class="btn btn-primary">Editar</button>
    <button class="btn btn-secondary">Ver</button>
  </div>
  
  <!-- Grupo 2: Ações secundárias (8px de espaço) -->
  <div class="button-group">
    <button class="btn btn-danger">Excluir</button>
  </div>
</div>
```

### 3. Espaçamento Interno de Botões

**Regra:** Botões dentro do mesmo grupo devem ter espaçamento de **4px**.

```css
.button-group .btn {
  margin-right: 4px;
}

.button-group .btn:last-child {
  margin-right: 0;
}
```

## 📐 Especificações Técnicas

| Elemento | Propriedade | Valor | Uso |
|----------|-------------|-------|-----|
| Grupo de botões | `margin-right` | `8px` | Entre grupos diferentes |
| Botões internos | `margin-right` | `4px` | Dentro do mesmo grupo |
| Colunas numéricas | `text-align` | `center` | Todas as colunas numéricas |

## 📱 Responsividade

### Mobile (< 768px)
- Colunas numéricas mantêm centralização
- Espaçamento entre grupos reduzido para 4px
- Botões empilham verticalmente dentro dos grupos

```css
@media (max-width: 767px) {
  .button-group {
    margin-right: 4px;
    display: flex;
    flex-direction: column;
  }
}
```

## ♿ Acessibilidade

- Navegação por teclado entre botões
- ARIA labels para grupos de ações
- Contraste adequado (4.5:1 mínimo)

## 🧪 Validação

### Checklist
- [ ] Colunas numéricas estão centralizadas
- [ ] Espaçamento entre grupos de botões é 8px
- [ ] Espaçamento interno dos botões é 4px
- [ ] Responsividade funciona em mobile
