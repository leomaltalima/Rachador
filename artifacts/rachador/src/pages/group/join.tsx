import { useState } from 'react';
import { useRoute, useLocation } from 'wouter';
import { 
  useGetGrupoPorConvite, 
  getGetGrupoPorConviteQueryKey,
  useCreateParticipante
} from '@workspace/api-client-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useParticipant } from '@/hooks/use-participant';
import { toast } from 'sonner';

export default function JoinGroup() {
  const [, params] = useRoute('/grupo/convite/:codigo');
  const [, setLocation] = useLocation();
  const codigo = params?.codigo || '';

  const { data: grupo, isLoading, error } = useGetGrupoPorConvite(codigo, {
    query: {
      enabled: !!codigo,
      queryKey: getGetGrupoPorConviteQueryKey(codigo)
    }
  });

  const [nome, setNome] = useState('');
  const [chavePix, setChavePix] = useState('');
  const createParticipante = useCreateParticipante();

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!grupo || !nome.trim()) return;

    createParticipante.mutate({
      grupoId: grupo.id,
      data: { nome, chavePix: chavePix || undefined }
    }, {
      onSuccess: (participante) => {
        // Save participant ID to localStorage
        localStorage.setItem(`rachador_participante_${grupo.id}`, participante.id.toString());
        toast.success(`Você entrou no grupo ${grupo.nome}!`);
        setLocation(`/grupo/${grupo.id}`);
      },
      onError: () => {
        toast.error('Erro ao entrar no grupo.');
      }
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center p-4 bg-background">
        <Card className="w-full max-w-md shadow-none">
          <CardHeader>
            <Skeleton className="h-6 w-1/2 mb-2" />
            <Skeleton className="h-4 w-3/4" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full mt-4" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !grupo) {
    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center p-4 bg-background text-center">
        <h2 className="text-xl font-bold mb-2">Grupo não encontrado</h2>
        <p className="text-muted-foreground mb-6">O código de convite pode ser inválido.</p>
        <Button onClick={() => setLocation('/')}>Voltar para o Início</Button>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-md border-border shadow-none">
        <CardHeader>
          <CardTitle>Entrar no grupo</CardTitle>
          <CardDescription className="text-base font-medium text-foreground mt-1">
            {grupo.nome}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleJoin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Seu nome</Label>
              <Input
                id="nome"
                placeholder="Como você quer ser chamado?"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                disabled={createParticipante.isPending}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pix">Sua chave Pix (Opcional)</Label>
              <Input
                id="pix"
                placeholder="Para receber transferências"
                className="font-mono"
                value={chavePix}
                onChange={(e) => setChavePix(e.target.value)}
                disabled={createParticipante.isPending}
              />
            </div>
            <Button type="submit" className="w-full" disabled={createParticipante.isPending || !nome.trim()}>
              {createParticipante.isPending ? 'Entrando...' : 'Entrar na divisão'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
