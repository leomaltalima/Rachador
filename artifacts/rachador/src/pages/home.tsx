import { useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useCreateGrupo, useCreateParticipante, Grupo } from '@workspace/api-client-react';
import { toast } from 'sonner';
import { Copy } from 'lucide-react';
import { copyToClipboard } from '@/lib/clipboard';

export default function Home() {
  const [, setLocation] = useLocation();
  const [nomeGrupo, setNomeGrupo] = useState('');
  const [codigoConvite, setCodigoConvite] = useState('');
  
  const [createdGrupo, setCreatedGrupo] = useState<Grupo | null>(null);
  const [meuNome, setMeuNome] = useState('');

  const createGrupo = useCreateGrupo();
  const createParticipante = useCreateParticipante();

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nomeGrupo.trim()) return;
    
    createGrupo.mutate({ data: { nome: nomeGrupo } }, {
      onSuccess: (grupo) => {
        toast.success('Grupo criado com sucesso!');
        setCreatedGrupo(grupo);
      },
      onError: () => {
        toast.error('Erro ao criar grupo');
      }
    });
  };

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!codigoConvite.trim()) return;
    setLocation(`/grupo/convite/${codigoConvite}`);
  };

  const handleCreateFirstParticipant = (e: React.FormEvent) => {
    e.preventDefault();
    if (!createdGrupo || !meuNome.trim()) return;

    createParticipante.mutate({
      grupoId: createdGrupo.id,
      data: { nome: meuNome }
    }, {
      onSuccess: (p) => {
        localStorage.setItem(`rachador_participante_${createdGrupo.id}`, p.id.toString());
        setLocation(`/grupo/${createdGrupo.id}`);
      },
      onError: () => {
        toast.error('Erro ao entrar no grupo');
      }
    });
  };

  if (createdGrupo) {
    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center p-4 bg-background">
        <div className="w-full max-w-md space-y-6 text-center">
          <div>
            <h1 className="text-2xl font-bold text-foreground mb-2">Grupo criado! 🎉</h1>
            <p className="text-muted-foreground text-sm">
              Compartilhe o código abaixo com seus amigos para eles entrarem.
            </p>
          </div>

          <Card className="border-border shadow-none">
            <CardContent className="p-6">
              <div className="bg-muted p-4 rounded-md flex items-center justify-between gap-4 mb-6">
                <span className="font-mono text-2xl font-bold tracking-wider uppercase text-foreground">
                  {createdGrupo.codigoConvite}
                </span>
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={() => copyToClipboard(createdGrupo.codigoConvite, 'Código copiado!')}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>

              <div className="text-left border-t border-border pt-6">
                <h3 className="font-medium text-foreground mb-4">Agora, adicione você mesmo ao grupo:</h3>
                <form onSubmit={handleCreateFirstParticipant} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="meu-nome">Seu nome</Label>
                    <Input
                      id="meu-nome"
                      placeholder="Como você quer ser chamado?"
                      value={meuNome}
                      onChange={(e) => setMeuNome(e.target.value)}
                      disabled={createParticipante.isPending}
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={createParticipante.isPending || !meuNome.trim()}>
                    {createParticipante.isPending ? 'Entrando...' : 'Entrar no grupo'}
                  </Button>
                </form>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center p-4 bg-background">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground tracking-tight">Rachador</h1>
          <p className="text-muted-foreground mt-2 text-sm">A forma definitiva de dividir despesas.</p>
        </div>

        <Card className="border-border shadow-none">
          <CardHeader>
            <CardTitle>Criar novo grupo</CardTitle>
            <CardDescription>Comece uma nova divisão de contas</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nome-grupo">Nome do grupo</Label>
                <Input
                  id="nome-grupo"
                  placeholder="Ex: Viagem para o Rio"
                  value={nomeGrupo}
                  onChange={(e) => setNomeGrupo(e.target.value)}
                  disabled={createGrupo.isPending}
                />
              </div>
              <Button type="submit" className="w-full" disabled={createGrupo.isPending || !nomeGrupo.trim()}>
                {createGrupo.isPending ? 'Criando...' : 'Criar Grupo'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground font-medium">Ou</span>
          </div>
        </div>

        <Card className="border-border shadow-none bg-muted/30">
          <CardHeader>
            <CardTitle className="text-lg">Entrar com código</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleJoin} className="space-y-4">
              <div className="space-y-2">
                <Input
                  id="codigo-convite"
                  placeholder="Ex: ABC-123"
                  className="font-mono uppercase text-center tracking-widest bg-background"
                  value={codigoConvite}
                  onChange={(e) => setCodigoConvite(e.target.value.toUpperCase())}
                />
              </div>
              <Button type="submit" variant="secondary" className="w-full font-medium" disabled={!codigoConvite.trim()}>
                Procurar Grupo
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
