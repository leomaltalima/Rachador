import { toast } from 'sonner';

export async function copyToClipboard(text: string, description: string = 'Copiado para a área de transferência') {
  try {
    await navigator.clipboard.writeText(text);
    toast.success(description);
  } catch (err) {
    toast.error('Falha ao copiar');
  }
}
