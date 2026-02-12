import { azureClient } from '../azure-client';

/**
 * Valida la conexión con Azure DevOps
 * Verifica que el PAT funciona correctamente
 */
export async function validateAzureConnection(): Promise<{
  success: boolean;
  message: string;
  details?: {
    user?: string;
    organization?: string;
    project?: string;
  };
}> {
  try {
    // Intentar obtener los proyectos para validar autenticación
    const response = await azureClient['client'].get('/_apis/projects?api-version=7.1&$top=1');
    
    if (response.status === 200) {
      return {
        success: true,
        message: '✅ Conexión exitosa con Azure DevOps',
        details: {
          organization: process.env.AZURE_ORG || 'cinemarkintl',
          project: process.env.AZURE_PROJECT || 'Core Backend',
        }
      };
    }
    
    return {
      success: false,
      message: '⚠️ Respuesta inesperada de Azure DevOps'
    };
    
  } catch (error: any) {
    if (error.response?.status === 401) {
      return {
        success: false,
        message: '❌ Error de autenticación: PAT inválido o expirado\n' +
                'Por favor verifica tu token en:\n' +
                'https://dev.azure.com/cinemarkintl/_usersSettings/tokens'
      };
    }
    
    if (error.response?.status === 403) {
      return {
        success: false,
        message: '❌ Permisos insuficientes\n' +
                'Tu PAT necesita los scopes:\n' +
                '- Work Items: Full\n' +
                '- Code: Read\n' +
                '- Project and Team: Read'
      };
    }
    
    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      return {
        success: false,
        message: '❌ No se puede conectar a Azure DevOps\n' +
                'Verifica tu conexión a internet'
      };
    }
    
    return {
      success: false,
      message: `❌ Error: ${error.message}`
    };
  }
}

/**
 * Tool: azure_test_connection
 * Comando: >oo azure-test
 * Valida que la conexión con Azure DevOps funciona correctamente
 */
export async function handleAzureTestConnection(): Promise<string> {
  const result = await validateAzureConnection();
  
  if (result.success && result.details) {
    let output = `${result.message}\n\n`;
    output += `📋 **Configuración:**\n`;
    output += `• Organización: ${result.details.organization}\n`;
    output += `• Proyecto: ${result.details.project}\n\n`;
    output += `✅ Todo está listo para usar los comandos Azure DevOps`;
    return output;
  }
  
  return result.message;
}
