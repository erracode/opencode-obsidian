import axios, { AxiosInstance, AxiosResponse } from 'axios';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { rateLimiter, withRetry } from './rate-limiter.js';

// Cargar variables de entorno
dotenv.config({ path: path.resolve(__dirname, '../../.env.local') });

export interface WorkItem {
  id: number;
  rev: number;
  url: string;
  fields: {
    'System.Id': number;
    'System.Title': string;
    'System.Description'?: string;
    'System.State': string;
    'System.WorkItemType': string;
    'System.AssignedTo'?: {
      displayName: string;
      uniqueName: string;
    };
    'System.CreatedDate'?: string;
    'System.ChangedDate'?: string;
    'Microsoft.VSTS.Scheduling.Effort'?: number;
    'Microsoft.VSTS.Scheduling.CompletedWork'?: number;
    'Microsoft.VSTS.Scheduling.RemainingWork'?: number;
    'System.IterationPath'?: string;
    'System.AreaPath'?: string;
    [key: string]: any;
  };
  relations?: Array<{
    rel: string;
    url: string;
    attributes?: {
      name?: string;
    };
  }>;
}

export interface WorkItemReference {
  id: number;
  url: string;
}

export interface WiqlResult {
  queryType: string;
  queryResultType: string;
  asOf: string;
  columns: Array<{
    referenceName: string;
    name: string;
    url: string;
  }>;
  workItems: WorkItemReference[];
}

export class AzureDevOpsClient {
  private client: AxiosInstance;
  private organization: string;
  private project: string;
  private apiVersion = '7.1';

  constructor() {
    const pat = process.env.AZURE_PAT;
    this.organization = process.env.AZURE_ORG || 'cinemarkintl';
    this.project = process.env.AZURE_PROJECT || 'Core Backend';

    if (!pat) {
      throw new Error(
        'AZURE_PAT no configurado. Por favor configura tu Personal Access Token:\n' +
        '1. Crea el archivo .env.local en mcp-server/\n' +
        '2. Agrega: AZURE_PAT=tu_token_aqui\n' +
        '3. Obtén tu token en: https://dev.azure.com/cinemarkintl/_usersSettings/tokens'
      );
    }

    // Codificar PAT en base64 (formato :{PAT})
    const encodedPat = Buffer.from(`:${pat}`).toString('base64');

    this.client = axios.create({
      baseURL: `https://dev.azure.com/${this.organization}`,
      headers: {
        'Authorization': `Basic ${encodedPat}`,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });

    // Interceptor para logging de errores
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response) {
          console.error('Azure DevOps API Error:', {
            status: error.response.status,
            message: error.response.data?.message || error.message,
            url: error.config?.url,
          });
        }
        return Promise.reject(error);
      }
    );
  }

  /**
   * Obtener work items asignados al usuario actual
   */
  async getMyWorkItems(states: string[] = ['New', 'Active', 'Resolved']): Promise<WorkItem[]> {
    const stateFilter = states.map(s => `[System.State] = '${s}'`).join(' OR ');
    
    const query = `
      SELECT [System.Id], [System.Title], [System.State], 
             [System.WorkItemType], [System.AssignedTo],
             [Microsoft.VSTS.Scheduling.Effort],
             [Microsoft.VSTS.Scheduling.CompletedWork],
             [Microsoft.VSTS.Scheduling.RemainingWork],
             [System.IterationPath], [System.ChangedDate]
      FROM workitems
      WHERE [System.TeamProject] = '${this.project}'
        AND [System.AssignedTo] = @Me
        AND (${stateFilter})
      ORDER BY [System.ChangedDate] DESC
    `;

    const result = await this.runWiqlQuery(query);
    
    if (result.workItems.length === 0) {
      return [];
    }

    // Obtener detalles de cada work item
    const workItemIds = result.workItems.map(wi => wi.id);
    return this.getWorkItemsBatch(workItemIds);
  }

  /**
   * Helper para hacer requests con rate limiting y retry
   */
  private async requestWithRateLimit<T>(fn: () => Promise<T>): Promise<T> {
    return rateLimiter.execute(() => withRetry(fn));
  }

  /**
   * Ejecutar query WIQL
   */
  async runWiqlQuery(query: string): Promise<WiqlResult> {
    return this.requestWithRateLimit(async () => {
      const response: AxiosResponse<WiqlResult> = await this.client.post(
        `/${this.project}/_apis/wit/wiql?api-version=${this.apiVersion}`,
        { query }
      );
      return response.data;
    });
  }

  /**
   * Obtener un work item por ID
   */
  async getWorkItem(id: number, expand: string = 'All'): Promise<WorkItem> {
    return this.requestWithRateLimit(async () => {
      const response: AxiosResponse<WorkItem> = await this.client.get(
        `/${this.project}/_apis/wit/workitems/${id}?api-version=${this.apiVersion}&$expand=${expand}`
      );
      return response.data;
    });
  }

  /**
   * Obtener múltiples work items
   */
  async getWorkItemsBatch(ids: number[]): Promise<WorkItem[]> {
    if (ids.length === 0) return [];
    
    return this.requestWithRateLimit(async () => {
      const response: AxiosResponse<{ value: WorkItem[] }> = await this.client.get(
        `/${this.project}/_apis/wit/workitemsbatch?api-version=${this.apiVersion}`,
        {
          data: {
            ids: ids,
            fields: [
              'System.Id',
              'System.Title',
              'System.State',
              'System.WorkItemType',
              'System.AssignedTo',
              'Microsoft.VSTS.Scheduling.Effort',
              'Microsoft.VSTS.Scheduling.CompletedWork',
              'Microsoft.VSTS.Scheduling.RemainingWork',
              'System.IterationPath',
              'System.ChangedDate',
              'System.Description'
            ]
          }
        }
      );
      return response.data.value;
    });
  }

  /**
   * Obtener el work item padre (HU) de una tarea
   */
  async getParentWorkItem(workItemId: number): Promise<WorkItem | null> {
    const workItem = await this.getWorkItem(workItemId);
    
    if (!workItem.relations) return null;

    const parentRelation = workItem.relations.find(
      rel => rel.rel === 'System.LinkTypes.Hierarchy-Reverse'
    );

    if (!parentRelation) return null;

    // Extraer ID del padre de la URL
    const parentId = parseInt(parentRelation.url.split('/').pop() || '0', 10);
    if (!parentId) return null;

    return this.getWorkItem(parentId);
  }

  /**
   * Agregar comentario a un work item
   */
  async addComment(workItemId: number, comment: string): Promise<void> {
    return this.requestWithRateLimit(async () => {
      const patchDocument = [
        {
          op: 'add',
          path: '/fields/System.History',
          value: comment
        }
      ];

      await this.client.patch(
        `/${this.project}/_apis/wit/workitems/${workItemId}?api-version=${this.apiVersion}`,
        patchDocument,
        {
          headers: {
            'Content-Type': 'application/json-patch+json'
          }
        }
      );
    });
  }

  /**
   * Actualizar estado de un work item
   */
  async updateWorkItemState(workItemId: number, newState: string): Promise<void> {
    return this.requestWithRateLimit(async () => {
      const patchDocument = [
        {
          op: 'replace',
          path: '/fields/System.State',
          value: newState
        }
      ];

      await this.client.patch(
        `/${this.project}/_apis/wit/workitems/${workItemId}?api-version=${this.apiVersion}`,
        patchDocument,
        {
          headers: {
            'Content-Type': 'application/json-patch+json'
          }
        }
      );
    });
  }

  /**
   * Crear una tarea DEV hija de una HU
   */
  async createChildTask(
    parentId: number, 
    title: string, 
    description: string,
    effort?: number
  ): Promise<number> {
    return this.requestWithRateLimit(async () => {
      const patchDocument: any[] = [
        {
          op: 'add',
          path: '/fields/System.Title',
          value: title
        },
        {
          op: 'add',
          path: '/fields/System.Description',
          value: description
        },
        {
          op: 'add',
          path: '/fields/System.WorkItemType',
          value: 'Task'
        },
        {
          op: 'add',
          path: '/relations/-',
          value: {
            rel: 'System.LinkTypes.Hierarchy-Reverse',
            url: `https://dev.azure.com/${this.organization}/_apis/wit/workItems/${parentId}`,
            attributes: {
              name: 'Parent'
            }
          }
        }
      ];

      if (effort !== undefined && effort > 0) {
        patchDocument.push({
          op: 'add',
          path: '/fields/Microsoft.VSTS.Scheduling.Effort',
          value: effort
        });
        patchDocument.push({
          op: 'add',
          path: '/fields/Microsoft.VSTS.Scheduling.RemainingWork',
          value: effort
        });
        patchDocument.push({
          op: 'add',
          path: '/fields/Microsoft.VSTS.Scheduling.CompletedWork',
          value: 0
        });
      }

      const response: AxiosResponse<WorkItem> = await this.client.post(
        `/${this.project}/_apis/wit/workitems/$Task?api-version=${this.apiVersion}`,
        patchDocument,
        {
          headers: {
            'Content-Type': 'application/json-patch+json'
          }
        }
      );

      return response.data.id;
    });
  }

  /**
   * Actualizar horas de trabajo (Effort/Completed/Remaining)
   */
  async updateWorkHours(workItemId: number, completed: number): Promise<void> {
    const workItem = await this.getWorkItem(workItemId);
    const effort = workItem.fields['Microsoft.VSTS.Scheduling.Effort'] || completed;
    const remaining = Math.max(0, effort - completed);

    return this.requestWithRateLimit(async () => {
      const patchDocument: any[] = [
        {
          op: 'replace',
          path: '/fields/Microsoft.VSTS.Scheduling.CompletedWork',
          value: completed
        },
        {
          op: 'replace',
          path: '/fields/Microsoft.VSTS.Scheduling.RemainingWork',
          value: remaining
        }
      ];

      await this.client.patch(
        `/${this.project}/_apis/wit/workitems/${workItemId}?api-version=${this.apiVersion}`,
        patchDocument,
        {
          headers: {
            'Content-Type': 'application/json-patch+json'
          }
        }
      );
    });
  }

  /**
   * Buscar Pull Requests relacionados a un work item
   */
  async findPullRequests(workItemId: number): Promise<any[]> {
    // Primero necesitamos obtener los repositorios del proyecto
    const reposResponse: AxiosResponse<{ value: any[] }> = await this.client.get(
      `/${this.project}/_apis/git/repositories?api-version=${this.apiVersion}`
    );

    const pullRequests: any[] = [];

    for (const repo of reposResponse.data.value) {
      try {
        const prResponse: AxiosResponse<{ value: any[] }> = await this.client.get(
          `/${this.project}/_apis/git/repositories/${repo.id}/pullrequests?api-version=${this.apiVersion}&searchCriteria.linkedWorkItems=true`
        );

        // Filtrar PRs que estén vinculados al work item
        const linkedPRs = prResponse.data.value.filter(pr => {
          // Verificar si el PR tiene el work item vinculado
          // Esto puede variar según la estructura exacta de la API
          return pr.description?.includes(workItemId.toString()) || 
                 pr.title?.includes(workItemId.toString());
        });

        pullRequests.push(...linkedPRs);
      } catch (error) {
        // Ignorar errores de repositorios individuales
        continue;
      }
    }

    return pullRequests;
  }

  /**
   * Obtener commits de un repositorio
   */
  async getCommits(repositoryId: string, branch?: string, top: number = 10): Promise<any[]> {
    const params = new URLSearchParams({
      'api-version': this.apiVersion,
      '$top': top.toString()
    });

    if (branch) {
      params.append('searchCriteria.itemVersion.version', branch);
    }

    const response: AxiosResponse<{ value: any[] }> = await this.client.get(
      `/${this.project}/_apis/git/repositories/${repositoryId}/commits?${params.toString()}`
    );

    return response.data.value;
  }

  /**
   * Formatear work item para display
   */
  formatWorkItemForDisplay(workItem: WorkItem): string {
    const id = workItem.fields['System.Id'];
    const title = workItem.fields['System.Title'];
    const state = workItem.fields['System.State'];
    const type = workItem.fields['System.WorkItemType'];
    const effort = workItem.fields['Microsoft.VSTS.Scheduling.Effort'];
    const completed = workItem.fields['Microsoft.VSTS.Scheduling.CompletedWork'];
    const remaining = workItem.fields['Microsoft.VSTS.Scheduling.RemainingWork'];
    const assignedTo = workItem.fields['System.AssignedTo']?.displayName || 'Unassigned';
    const iteration = workItem.fields['System.IterationPath'] || 'No sprint';

    let display = `#${id} ${title}\n`;
    display += `  Tipo: ${type} | Estado: ${state}\n`;
    display += `  Asignado a: ${assignedTo} | Sprint: ${iteration}\n`;
    
    if (effort !== undefined) {
      display += `  Effort: ${effort}h | Completado: ${completed || 0}h | Remaining: ${remaining || effort}h\n`;
    }

    display += `  Link: https://dev.azure.com/${this.organization}/${this.project}/_workitems/edit/${id}\n`;

    return display;
  }
}

// Exportar instancia singleton
export const azureClient = new AzureDevOpsClient();
