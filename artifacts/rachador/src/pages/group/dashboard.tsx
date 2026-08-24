import { useState, useMemo, useRef } from 'react';
import { useRoute, useLocation, Link } from 'wouter';
import { 
  useGetGrupo, getGetGrupoQueryKey,
  useListDespesas, getListDespesasQueryKey,
  useGetSaldo, getGetSaldoQueryKey,
  useListParticipantes, getListParticipantesQueryKey,
  useDeleteDespesa,
  useQuitarDivisao,
  useUpdateParticipante
} from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { Copy, Plus, ArrowRight, Pencil, Trash2 } from 'lucide-react';
import { formatBRL, cn } from '@/lib/utils';
import { copyToClipboard } from '@/lib/clipboard';
import { useParticipant } from '@/hooks/use-participant';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

export default function GroupDashboard() {
  const [, params] = useRoute('/grupo/:id');
  const [, setLocation] = useLocation();
  const grupoId = parseInt(params?.id || '0', 10);
  
  const queryClient = useQueryClient();
  const { participanteId } = useParticipant(grupoId);

  const { data: grupo, isLoading: isLoadingGrupo } = useGetGrupo(grupoId, {
    query: { enabled: !!grupoId, queryKey: getGetGrupoQueryKey(grupoId) }
  });

  if (!isLoadingGrupo && grupo && !participanteId) {
    // If not a participant in local storage, force to join screen
    setLocation(`/grupo/convite/${grupo.codigoConvite}`);
    return null;
  }

  const { data: despesas = [], isLoading: isLoadingDespesas } = useListDespesas(grupoId, {
    query: { enabled: !!grupoId, queryKey: getListDespesasQueryKey(grupoId) }
  });

  const { data: saldo, isLoading: isLoadingSaldo } = useGetSaldo(grupoId, {
    query: { enabled: !!grupoId, queryKey: getGetSaldoQueryKey(grupoId) }
  });

  const { data: participantes = [], isLoading: isLoadingParticipantes } = useListParticipantes(grupoId, {
    query: { enabled: !!grupoId, queryKey: getListParticipantesQueryKey(grupoId) }
  });

  const deleteDespesa = useDeleteDespesa();
  const [despesaToDelete, setDespesaToDelete] = useState<number | null>(null);

  const handleDeleteDespesa = () => {
    if (!despesaToDelete) return;
    deleteDespesa.mutate({ id: despesaToDelete }, {
      onSuccess: () => {
        toast.success('Despesa excluída');
        queryClient.invalidateQueries({ queryKey: getListDespesasQueryKey(grupoId) });
        queryClient.invalidateQueries({ queryKey: getGetSaldoQueryKey(grupoId) });
        setDespesaToDelete(null);
      },
      onError: () => toast.error('Erro ao excluir')
    });
  };

  const getInitials = (name: string) => {
    return name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
  };

  if (isLoadingGrupo) {
    return <div className="p-4"><Skeleton className="h-20 w-full" /></div>;
  }

  if (!grupo) {
    return <div className="p-4 text-center">Grupo não encontrado</div>;
  }

  return (
    <div className="min-h-[100dvh] bg-background pb-20">
      <header className="bg-card border-b border-border sticky top-0 z-10">
        <div className="px-4 py-4 max-w-xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground">{grupo.nome}</h1>
            <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
              <span>Código:</span>
              <span className="font-mono text-foreground">{grupo.codigoConvite}</span>
              <button 
                onClick={() => copyToClipboard(grupo.codigoConvite, 'Código copiado!')}
                className="hover:text-foreground transition-colors"
                aria-label="Copiar código"
              >
                <Copy className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="px-4 py-6 max-w-xl mx-auto">
        <Tabs defaultValue="despesas" className="w-full">
          <TabsList className="w-full grid grid-cols-3 mb-6 bg-card border border-border h-11 p-1">
            <TabsTrigger value="despesas">Despesas</TabsTrigger>
            <TabsTrigger value="saldo">Saldo</TabsTrigger>
            <TabsTrigger value="participantes">Pessoas</TabsTrigger>
          </TabsList>

          <TabsContent value="despesas" className="space-y-4">
            {isLoadingDespesas ? (
              <div className="space-y-3">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
              </div>
            ) : despesas.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p>Nenhuma despesa registrada ainda.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {despesas.map(d => (
                  <Card key={d.id} className="shadow-none border-border">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-semibold text-foreground">{d.descricao}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-sm text-muted-foreground">
                              Pago por
                            </span>
                            {d.pagoPorId === participanteId ? (
                              <span className="text-xs bg-accent text-accent-foreground px-2 py-0.5 rounded-full font-medium">
                                você
                              </span>
                            ) : (
                              <span className="text-sm font-medium">{d.pagoPor.nome}</span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-2">
                            {new Date(d.criadoEm).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                        <div className="flex flex-col items-end">
                          <span className="font-mono font-bold text-lg">{formatBRL(d.valor)}</span>
                          <button 
                            onClick={() => setDespesaToDelete(d.id)}
                            className="mt-2 text-muted-foreground hover:text-destructive transition-colors p-1"
                            aria-label="Excluir despesa"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            <div className="fixed bottom-6 left-0 right-0 px-4 max-w-xl mx-auto pointer-events-none">
              <Button 
                size="lg" 
                className="w-full shadow-lg pointer-events-auto gap-2"
                onClick={() => setLocation(`/grupo/${grupoId}/nova-despesa`)}
              >
                <Plus className="h-5 w-5" /> Nova Despesa
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="saldo" className="space-y-6">
            <SaldoTab 
              grupoId={grupoId} 
              saldo={saldo} 
              isLoading={isLoadingSaldo} 
              despesas={despesas} 
              participanteId={participanteId}
            />
          </TabsContent>

          <TabsContent value="participantes" className="space-y-4">
            <ParticipantesTab 
              participantes={participantes} 
              saldo={saldo} 
              isLoading={isLoadingParticipantes} 
              meuId={participanteId}
              getInitials={getInitials}
            />
          </TabsContent>
        </Tabs>
      </main>

      <Dialog open={!!despesaToDelete} onOpenChange={(open) => !open && setDespesaToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir Despesa</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir esta despesa? Isso recalculará todos os saldos.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDespesaToDelete(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleDeleteDespesa} disabled={deleteDespesa.isPending}>
              {deleteDespesa.isPending ? 'Excluindo...' : 'Excluir'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SaldoTab({ grupoId, saldo, isLoading, despesas, participanteId }: any) {
  const queryClient = useQueryClient();
  const quitarDivisao = useQuitarDivisao();

  const handleQuitar = async (deId: number, paraId: number) => {
    // Find all divisoes where "deId" owes "paraId" and not quitado
    const divisoesToQuitar: number[] = [];
    despesas.forEach((d: any) => {
      if (d.pagoPorId === paraId) {
        d.divisoes.forEach((div: any) => {
          if (div.participanteId === deId && !div.quitado) {
            divisoesToQuitar.push(div.id);
          }
        });
      }
    });

    if (divisoesToQuitar.length === 0) return;

    try {
      for (const id of divisoesToQuitar) {
        await quitarDivisao.mutateAsync({ id });
      }
      toast.success('Pagamento registrado!');
      queryClient.invalidateQueries({ queryKey: getGetSaldoQueryKey(grupoId) });
      queryClient.invalidateQueries({ queryKey: getListDespesasQueryKey(grupoId) });
    } catch {
      toast.error('Erro ao registrar pagamento');
    }
  };

  if (isLoading) return <Skeleton className="h-40 w-full" />;
  if (!saldo) return null;

  return (
    <div className="space-y-6 pb-20">
      <div className="text-center py-4">
        <p className="text-sm text-muted-foreground uppercase tracking-wider mb-1">Total Gasto</p>
        <p className="text-4xl font-mono font-bold text-foreground tracking-tight">
          {formatBRL(saldo.totalGasto)}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {saldo.participantes.map((p: any) => (
          <Card key={p.participante.id} className="shadow-none border-border">
            <CardContent className="p-3">
              <div className="flex items-center gap-2 mb-2">
                <p className="font-medium text-sm truncate">{p.participante.nome}</p>
                {p.participante.id === participanteId && (
                  <span className="h-2 w-2 rounded-full bg-primary" />
                )}
              </div>
              <p className={cn(
                "font-mono font-bold text-sm",
                p.saldoLiquido > 0 ? "text-primary" : p.saldoLiquido < 0 ? "text-destructive" : "text-muted-foreground"
              )}>
                {p.saldoLiquido > 0 ? '+' : ''}{formatBRL(p.saldoLiquido)}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {saldo.transferencias.length > 0 && (
        <div className="pt-4">
          <h3 className="font-bold text-lg mb-3">Como acertar</h3>
          <div className="space-y-3">
            {saldo.transferencias.map((t: any, i: number) => (
              <Card key={i} className="shadow-none border-border">
                <CardContent className="p-4">
                  <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <span>{t.de.id === participanteId ? 'Você' : t.de.nome}</span>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      <span>{t.para.id === participanteId ? 'Você' : t.para.nome}</span>
                    </div>
                    <span className="font-mono font-bold text-foreground">{formatBRL(t.valor)}</span>
                  </div>
                  {(t.de.id === participanteId || t.para.id === participanteId) && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full font-medium"
                      onClick={() => handleQuitar(t.de.id, t.para.id)}
                      disabled={quitarDivisao.isPending}
                    >
                      Registrar pagamento
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ParticipantesTab({ participantes, saldo, isLoading, meuId, getInitials }: any) {
  const [editingPix, setEditingPix] = useState<number | null>(null);
  const [pixValue, setPixValue] = useState('');
  const updateParticipante = useUpdateParticipante();
  const queryClient = useQueryClient();

  const handleEditPix = (p: any) => {
    setEditingPix(p.id);
    setPixValue(p.chavePix || '');
  };

  const handleSavePix = async (p: any) => {
    await updateParticipante.mutateAsync({
      id: p.id,
      data: { chavePix: pixValue || null }
    });
    setEditingPix(null);
    queryClient.invalidateQueries({ queryKey: getListParticipantesQueryKey(p.grupoId) });
    toast.success('Chave Pix atualizada');
  };

  if (isLoading) return <Skeleton className="h-40 w-full" />;

  return (
    <div className="space-y-3 pb-20">
      {participantes.map((p: any) => {
        const saldoInfo = saldo?.participantes.find((sp: any) => sp.participante.id === p.id);
        const isMe = p.id === meuId;

        return (
          <Card key={p.id} className="shadow-none border-border overflow-hidden">
            <CardContent className="p-4 flex gap-4">
              <Avatar className={cn(isMe ? "bg-accent" : "bg-muted")}>
                <AvatarFallback className={cn(
                  "font-medium",
                  isMe ? "text-accent-foreground" : "text-muted-foreground"
                )}>
                  {getInitials(p.nome)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start mb-1">
                  <div className="flex items-center gap-2">
                    <p className="font-bold">{p.nome}</p>
                    {isMe && (
                      <span className="text-[10px] uppercase tracking-wider font-bold bg-accent text-accent-foreground px-1.5 py-0.5 rounded-sm">
                        Você
                      </span>
                    )}
                  </div>
                  {saldoInfo && (
                    <span className={cn(
                      "font-mono font-bold text-sm",
                      saldoInfo.saldoLiquido > 0 ? "text-primary" : saldoInfo.saldoLiquido < 0 ? "text-destructive" : "text-muted-foreground"
                    )}>
                      {formatBRL(saldoInfo.saldoLiquido)}
                    </span>
                  )}
                </div>

                {editingPix === p.id ? (
                  <div className="flex gap-2 mt-2">
                    <Input 
                      value={pixValue} 
                      onChange={(e) => setPixValue(e.target.value)} 
                      placeholder="Chave Pix" 
                      className="h-8 text-sm font-mono"
                      autoFocus
                    />
                    <Button size="sm" onClick={() => handleSavePix(p)} disabled={updateParticipante.isPending}>
                      Salvar
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-muted-foreground">Pix:</span>
                    {p.chavePix ? (
                      <div className="flex items-center gap-1.5 max-w-[150px]">
                        <span className="font-mono text-xs truncate" title={p.chavePix}>
                          {p.chavePix}
                        </span>
                        <button 
                          onClick={() => copyToClipboard(p.chavePix, 'Chave Pix copiada')}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          <Copy className="h-3 w-3" />
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground italic">Não informado</span>
                    )}
                    {isMe && (
                      <button 
                        onClick={() => handleEditPix(p)}
                        className="ml-1 text-muted-foreground hover:text-foreground"
                      >
                        <Pencil className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
