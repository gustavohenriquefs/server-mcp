import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs/promises';
import { z } from 'zod';
import cors from 'cors';

// Definir esquemas de validação
const DataGridRulesSchema = z.object({
  numericColumns: z.literal('centralized'),
  buttonGroupSpacing: z.literal('8px'),
  buttonInternalSpacing: z.literal('4px')
});

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(cors({
  origin: '*',
  exposedHeaders: ['Mcp-Session-Id'],
  allowedHeaders: ['Content-Type', 'mcp-session-id'],
}));

// Função para criar o servidor MCP
function createMCPServer(): McpServer {
  const server = new McpServer({
    name: 'DataGrid Rules Server',
    version: '1.0.0',
  });

  // Registrar ferramenta para obter regras do DataGrid
  server.tool(
    'get_datagrid_rules',
    'Obtém as regras completas do DataGrid incluindo centralização de colunas numéricas e espaçamento entre botões',
    {
      component: z.string().default('datagrid').describe('Componente a consultar'),
      fileRequested: z.string().default('regras').describe('Arquivo de documentação solicitado')
    },
    async ({ component, fileRequested }: { component: string, fileRequested: string }) => {
      try {
        if (component !== 'datagrid') {
          return {
            content: [{
              type: 'text' as const,
              text: `Erro: Componente '${component}' não suportado. Apenas 'datagrid' é suportado.`
            }],
            isError: true
          };
        }

        if (fileRequested !== 'regras') {
          return {
            content: [{
              type: 'text' as const,
              text: `Erro: Documento '${fileRequested}' não encontrado. Apenas 'regras' está disponível.`
            }],
            isError: true
          };
        }

        // Caminho para o arquivo de regras
        const regrasPath = path.join(__dirname, '..', 'docs', 'datagrid', 'docs', 'regras.md');
        
        try {
          const regrasContent = await fs.readFile(regrasPath, 'utf-8');
          
          const response = {
            component: 'DataGrid',
            document: 'regras',
            content: regrasContent,
            rules: {
              dataGrid: {
                numericColumns: 'centralized' as const,
                buttonGroupSpacing: '8px' as const,
                buttonInternalSpacing: '4px' as const
              }
            }
          };

          return {
            content: [{
              type: 'text' as const,
              text: `# DataGrid Rules\n\n${regrasContent}\n\n## Regras Implementadas:\n- **Colunas Numéricas**: ${response.rules.dataGrid.numericColumns}\n- **Espaçamento entre Grupos**: ${response.rules.dataGrid.buttonGroupSpacing}\n- **Espaçamento Interno**: ${response.rules.dataGrid.buttonInternalSpacing}`
            }],
            structuredContent: response
          };
        } catch (fileError) {
          return {
            content: [{
              type: 'text' as const,
              text: `Erro ao ler arquivo de regras: ${fileError instanceof Error ? fileError.message : String(fileError)}`
            }],
            isError: true
          };
        }
      } catch (error) {
        return {
          content: [{
            type: 'text' as const,
            text: `Erro interno: ${error instanceof Error ? error.message : String(error)}`
          }],
          isError: true
        };
      }
    }
  );

  // Registrar recurso com as regras do DataGrid
  server.resource(
    'datagrid-rules',
    'datagrid://rules/regras',
    {
      title: 'Regras do DataGrid',
      description: 'Regras de design para componente DataGrid incluindo centralização e espaçamentos',
      mimeType: 'text/markdown'
    },
    async () => {
      try {
        const regrasPath = path.join(__dirname, '..', 'docs', 'datagrid', 'docs', 'regras.md');
        const regrasContent = await fs.readFile(regrasPath, 'utf-8');
        
        return {
          contents: [{
            uri: 'datagrid://rules/regras',
            text: regrasContent,
            mimeType: 'text/markdown'
          }]
        };
      } catch (error) {
        return {
          contents: [{
            uri: 'datagrid://rules/regras',
            text: `Erro ao carregar regras: ${error instanceof Error ? error.message : String(error)}`,
            mimeType: 'text/plain'
          }]
        };
      }
    }
  );

  return server;
}

// Armazenar transports para gerenciamento de sessão
const transports: { [sessionId: string]: StreamableHTTPServerTransport } = {};

// Função utilitária para verificar se é uma requisição de inicialização
function isInitializeRequest(body: any): boolean {
  return body && body.method === 'initialize';
}

// Endpoint principal do MCP
app.post('/mcp', async (req: Request, res: Response) => {
  try {
    const sessionId = req.headers['mcp-session-id'] as string | undefined;
    let transport: StreamableHTTPServerTransport;

    if (sessionId && transports[sessionId]) {
      // Reutilizar transport existente
      transport = transports[sessionId];
    } else if (!sessionId && isInitializeRequest(req.body)) {
      // Nova requisição de inicialização
      transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => Math.random().toString(36).substring(2, 15),
        onsessioninitialized: (newSessionId: string) => {
          transports[newSessionId] = transport;
        },
      });

      const server = createMCPServer();
      await server.connect(transport);

      // Limpar transport quando fechado
      transport.onclose = () => {
        if (transport.sessionId) {
          delete transports[transport.sessionId];
        }
      };
    } else {
      // Requisição inválida
      return res.status(400).json({
        jsonrpc: '2.0',
        error: {
          code: -32000,
          message: 'Bad Request: No valid session ID provided',
        },
        id: null,
      });
    }

    // Processar a requisição
    await transport.handleRequest(req, res, req.body);
  } catch (error) {
    console.error('Erro no MCP request:', error);
    if (!res.headersSent) {
      res.status(500).json({
        jsonrpc: '2.0',
        error: {
          code: -32603,
          message: 'Internal server error',
        },
        id: null,
      });
    }
  }
});

// Handler para requisições GET (SSE para notificações)
const handleSessionRequest = async (req: Request, res: Response) => {
  const sessionId = req.headers['mcp-session-id'] as string | undefined;
  if (!sessionId || !transports[sessionId]) {
    res.status(400).send('Invalid or missing session ID');
    return;
  }
  
  const transport = transports[sessionId];
  await transport.handleRequest(req, res);
};

app.get('/mcp', handleSessionRequest);

// Endpoint de limpeza de sessão
app.delete('/mcp', async (req: Request, res: Response) => {
  const sessionId = req.headers['mcp-session-id'] as string | undefined;
  if (sessionId && transports[sessionId]) {
    const transport = transports[sessionId];
    transport.close();
    delete transports[sessionId];
    res.status(200).send('Session terminated');
  } else {
    res.status(400).send('Invalid or missing session ID');
  }
});

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'OK',
    service: 'MCP DataGrid Rules Server',
    version: '1.0.0',
    protocol: 'Model Context Protocol 2025-06-18',
    timestamp: new Date().toISOString(),
    endpoints: {
      mcp: '/mcp',
      health: '/health'
    }
  });
});

// Middleware para rotas não encontradas
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'Route not found',
    availableEndpoints: [
      'POST /mcp - MCP protocol endpoint',
      'GET /mcp - SSE notifications endpoint',  
      'DELETE /mcp - Session termination endpoint',
      'GET /health - Health check'
    ],
    documentation: 'https://spec.modelcontextprotocol.io/specification/2025-06-18/'
  });
});

// Iniciar servidor
const server = app.listen(Number(PORT), () => {
  console.log(`🚀 MCP DataGrid Rules Server (Official Protocol) rodando em http://localhost:${PORT}`);
  console.log(`📋 Health check: http://localhost:${PORT}/health`);
  console.log(`� MCP Endpoint: http://localhost:${PORT}/mcp`);
  console.log(`📝 Protocol: Model Context Protocol 2025-06-18`);
  console.log(`🛠️  Tools: get_datagrid_rules`);
  console.log(`📚 Resources: datagrid-rules`);
  console.log(`⚡ Server ready for MCP connections!`);
});

// Tratamento gracioso de encerramento
process.on('SIGTERM', () => {
  console.log('🛑 Received SIGTERM, shutting down gracefully...');
  server.close(() => {
    console.log('✅ Server closed successfully');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🛑 Received SIGINT, shutting down gracefully...');
  server.close(() => {
    console.log('✅ Server closed successfully');
    process.exit(0);
  });
});
