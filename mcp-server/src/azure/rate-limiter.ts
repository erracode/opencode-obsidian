/**
 * Rate Limiter para Azure DevOps API
 * Azure tiene límites de 200-300 requests/minuto
 * Implementamos delays para evitar bloqueos
 */

export class RateLimiter {
  private lastRequestTime: number = 0;
  private minDelayMs: number = 200; // Mínimo 200ms entre requests (5 req/seg max)
  private queue: Array<() => void> = [];
  private processing: boolean = false;

  /**
   * Ejecuta una función con rate limiting
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          await this.waitIfNeeded();
          const result = await fn();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
      
      this.processQueue();
    });
  }

  /**
   * Espera el tiempo necesario antes de hacer el siguiente request
   */
  private async waitIfNeeded(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    
    if (timeSinceLastRequest < this.minDelayMs) {
      const waitTime = this.minDelayMs - timeSinceLastRequest;
      await this.sleep(waitTime);
    }
    
    this.lastRequestTime = Date.now();
  }

  /**
   * Procesa la cola de requests
   */
  private async processQueue(): Promise<void> {
    if (this.processing || this.queue.length === 0) {
      return;
    }

    this.processing = true;

    while (this.queue.length > 0) {
      const task = this.queue.shift();
      if (task) {
        await task();
      }
    }

    this.processing = false;
  }

  /**
   * Sleep helper
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Exportar instancia global
export const rateLimiter = new RateLimiter();

/**
 * Retry con backoff exponencial
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: any;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      
      // No reintentar en errores de autenticación o autorización
      if (error.response?.status === 401 || error.response?.status === 403) {
        throw error;
      }
      
      // No reintentar si es el último intento
      if (attempt === maxRetries - 1) {
        throw error;
      }
      
      // Calcular delay con backoff exponencial
      const delay = baseDelay * Math.pow(2, attempt);
      console.log(`⚠️  Intento ${attempt + 1} fallido. Reintentando en ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
}

/**
 * Wrapper que combina rate limiting + retry
 */
export async function withRateLimitAndRetry<T>(fn: () => Promise<T>): Promise<T> {
  return rateLimiter.execute(() => withRetry(fn));
}
