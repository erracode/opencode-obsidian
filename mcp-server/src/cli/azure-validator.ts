import axios from 'axios';

export interface AzureValidationResult {
  valid: boolean;
  organization?: string;
  project?: string;
  error?: string;
}

export async function validateAzurePAT(
  pat: string,
  organization: string,
  project: string
): Promise<AzureValidationResult> {
  try {
    const encodedPat = Buffer.from(`:${pat}`).toString('base64');
    
    const response = await axios.get(
      `https://dev.azure.com/${organization}/_apis/projects/${encodeURIComponent(project)}?api-version=7.1`,
      {
        headers: {
          'Authorization': `Basic ${encodedPat}`
        },
        timeout: 10000
      }
    );
    
    return {
      valid: true,
      organization,
      project: response.data.name
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
