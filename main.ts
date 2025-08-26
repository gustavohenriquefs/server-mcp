import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(cors());

// Rota para obter regras do DataGrid
app.get('/docs/datagrid/regras', (req: Request, res: Response) => {
    const regrasPath = path.join(__dirname, '..', 'docs', 'datagrid', 'docs', 'regras.md');
    
    if (!fs.existsSync(regrasPath)) {
        return res.status(404).send({ 
            error: 'Regras do DataGrid não encontradas.'
        });
    }

    fs.readFile(regrasPath, 'utf8', (err, data) => {
        if (err) {
            console.error('Erro ao ler regras:', err);
            return res.status(500).send({ error: 'Erro interno do servidor.' });
        }
        
        res.send({ 
            component: 'DataGrid',
            document: 'regras',
            content: data,
            rules: {
                numericColumns: 'centralized',
                buttonGroupSpacing: '8px',
                buttonInternalSpacing: '4px'
            }
        });
    });
});

// Rota principal para o MCP
app.post('/getContext', (req: Request, res: Response) => {
    const { fileRequested, component } = req.body;

    if (!fileRequested) {
        return res.status(400).send({ 
            error: 'Parâmetro fileRequested é obrigatório.',
            example: { fileRequested: 'regras', component: 'datagrid' }
        });
    }

    // Apenas suporta DataGrid por enquanto
    if (!component || component !== 'datagrid') {
        return res.status(400).send({
            error: 'Componente deve ser especificado.',
            supportedComponents: ['datagrid']
        });
    }

    const docPath = path.join(__dirname, '..', 'docs', 'datagrid', 'docs', `${fileRequested}.md`);
    
    if (!fs.existsSync(docPath)) {
        return res.status(404).send({ 
            error: `Documento '${fileRequested}' não encontrado para ${component}.`,
            availableDocs: ['regras']
        });
    }

    fs.readFile(docPath, 'utf8', (err, data) => {
        if (err) {
            console.error('Erro ao ler arquivo:', err);
            return res.status(500).send({ error: 'Erro interno do servidor.' });
        }
        
        res.send({ 
            context: data,
            component,
            document: fileRequested,
            rules: {
                dataGrid: {
                    numericColumns: 'centralized',
                    buttonGroupSpacing: '8px',
                    buttonInternalSpacing: '4px'
                }
            }
        });
    });
});

// Health check
app.get('/health', (req: Request, res: Response) => {
    res.send({ 
        status: 'OK', 
        service: 'MCP DataGrid Rules Server',
        version: '1.0.0',
        timestamp: new Date().toISOString()
    });
});

// Middleware para tratamento de erros 404
app.use((req: Request, res: Response) => {
    res.status(404).send({
        error: 'Rota não encontrada',
        availableRoutes: [
            'POST /getContext',
            'GET /docs/datagrid/regras',
            'GET /health'
        ],
        examples: {
            getDataGridRules: 'POST /getContext com {"fileRequested": "regras", "component": "datagrid"}',
            getRegrasDirectly: 'GET /docs/datagrid/regras'
        }
    });
});

// Middleware para tratamento de erros globais
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error('Erro não tratado:', err);
    res.status(500).send({ error: 'Erro interno do servidor' });
});

const server = app.listen(Number(PORT), () => {
    console.log(`🚀 MCP DataGrid Rules Server rodando em http://localhost:${PORT}`);
    console.log(`📋 Health check: http://localhost:${PORT}/health`);
    console.log(`📝 Regras DataGrid: http://localhost:${PORT}/docs/datagrid/regras`);
    console.log(`🎯 Uso principal: POST /getContext com {"fileRequested": "regras", "component": "datagrid"}`);
    console.log(`⚡ Servidor pronto para requisições!`);
});
// Auto-reload test
