# Data Grid - Regras de Design

## 📁 Estrutura

```
docs/datagrid/
├── docs/
│   └── regras.md      # 📋 Regras principais de design
└── README.md          # Este arquivo
```

## 🎯 Regras Implementadas

### 1. **Colunas Numéricas Centralizadas**
- Aplicação automática da classe `.numeric`
- `text-align: center` para valores numéricos

### 2. **Espaçamento Entre Grupos de Botões: 8px**
- Margem de 8px entre diferentes grupos de ações
- Último grupo sem margem direita

### 3. **Espaçamento Interno de Botões: 4px**
- Margem de 4px entre botões do mesmo grupo

## 🚀 Como Usar

### Via API MCP
```bash
# Obter regras do DataGrid
curl -X POST http://localhost:3000/getContext \
  -H "Content-Type: application/json" \
  -d '{"fileRequested": "regras", "component": "datagrid"}'

# Ou diretamente
curl http://localhost:3000/docs/datagrid/regras
```

### CSS Básico
```css
.data-grid th.numeric,
.data-grid td.numeric {
  text-align: center;
}

.button-group {
  margin-right: 8px;
}

.button-group:last-child {
  margin-right: 0;
}

.button-group .btn {
  margin-right: 4px;
}
```

## � Validação

- [ ] Colunas numéricas centralizadas
- [ ] Espaçamento de 8px entre grupos de botões
- [ ] Espaçamento de 4px dentro dos grupos
