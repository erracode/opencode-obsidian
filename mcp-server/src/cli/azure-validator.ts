import axios from 'axios';

export interface AzureValidationResult {
  valid: boolean;
  organization?: string;
  project?: string;
  error?: string;
  hasWorkItemsAccess?: boolean;
}

/**
 * Valida el PAT de Azure DevOps
 * Verifica acceso al proyecto y permisos de Work Items
 */
export async function validateAzurePAT(
  pat: string,
  organization: string,
  project: string
): Promise<AzureValidationResult> {
  try {
    const encodedPat = Buffer.from(`:${pat}`).toString('base64');
    
    // 1. Verificar acceso al proyecto
    const projectResponse = await axios.get(
      `https://dev.azure.com/${organization}/_apis/projects/${encodeURIComponent(project)}?api-version=7.1`,
      {
        headers: {
          'Authorization': `Basic ${encodedPat}`
        },
        timeout: 10000
      }
    );
    
    // 2. Verificar acceso a Work Items (WIQL simple query)
    let hasWorkItemsAccess = false;
    try {
      await axios.post(
        `https://dev.azure.com/${organization}/${encodeURIComponent(project)}/_apis/wit/wiql?api-version=7.1`,
        {
          query: "SELECT [System.Id] FROM WorkItems WHERE [System.Id] = 0"
        },
        {
          headers: {
            'Authorization': `Basic ${encodedPat}`,
            'Content-Type': 'application/json'
          },
          timeout: 10000
        }
      );
      hasWorkItemsAccess = true;
    } catch (wiqlError: unknown) {
      const wiqlErr = wiqlError as { response?: { status?: number } };
      if (wiqlErr.response?.status === 401) {
        return {
          valid: true,
          organization,
          project: projectResponse.data.name,
          hasWorkItemsAccess: false,
          error: 'PAT sin permisos para Work Items. Necesitas scope "Work Items (Read & Write)"'
        };
      }
    }
    
    return {
      valid: true,
      organization,
      project: projectResponse.data.name,
      hasWorkItemsAccess
    };
    
  } catch (error: unknown) {
    const axiosError = error as { response?: { status?: number }; message?: string };
    
    if (axiosError.response?.status === 401) {
      return {
        valid: false,
        error: 'PAT inválido o expirado'
      };
    }
    
    if (axiosError.response?.status === 404) {
      return {
        valid: false,
        error: `Proyecto '${project}' no encontrado en organización '${organization}'`
      };
    }
    
    return {
      valid: false,
      error: axiosError.message || 'Error de conexión'
    };
  }
}

export function getAzurePATFromEnv(): string | null {
  return process.env.AZURE_PAT || null;
}
