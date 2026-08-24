import { useState, useMemo } from 'react';
import { useRoute, useLocation } from 'wouter';
import { 
  useGetGrupo, getGetGrupoQueryKey,
  useListParticipantes, getListParticipantesQueryKey,
  useCreateDespesa, getListDespesasQueryKey, getGetSaldoQueryKey
} from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft } from 'lucide-react';
import { useParticipant } from '@/hooks/use-participant';
import { formatBRL, cn } from '@/lib/utils';
import { toast } from 'sonner';

export default function NewExpense() {
  const [, params] = useRoute('/grupo/:id/nova-despesa');
  const [, setLocation] = useLocation();
  const grupoId = parseInt(params?.id || '0', 10);
  
  const queryClient = useQueryClient();
  const { participanteId } = useParticipant(grupoId);

  const { data: grupo } = useGetGrupo(grupoId, {
    query: { enabled: !!grupoId, queryKey: getGetGrupoQueryKey(grupoId) }
  });

  const { data: participantes = [] } = useListParticipantes(grupoId, {
    query: { enabled: !!grupoId, queryKey: getListParticipantesQueryKey(grupoId) }
  });

  const [descricao, setDescricao] = useState('');
  const [valorStr, setValorStr] = useState('');
  const [pagoPorId, setPagoPorId] = useState<string>(participanteId?.toString() || '');
  
  const [customSplit, setCustomSplit] = useState(false);
  const [customValues, setCustomValues] = useState<Record<number, string>>({});
  
  const createDespesa = useCreateDespesa();

  // Handle participant list loading / default paid by
  useMemo(() => {
    if (!pagoPorId && participanteId) {
      setPagoPorId(participanteId.toString());
    } else if (!pagoPorId && participantes.length > 0) {
      setPagoPorId(participantes[0].id.toString());
    }
  }, [participanteId, participantes, pagoPorId]);

  const valor = parseFloat(valorStr.replace(',', '.')) || 0;

  const handleCustomValueChange = (id: number, val: string) => {
    setCustomValues(prev => ({ ...prev, [id]: val }));
  };

  const currentSum = useMemo(() => {
    if (!customSplit) return valor;
    return Object.values(customValues).reduce((acc, curr) => acc + (parseFloat(curr.replace(',', '.')) || 0), 0);
  }, [customValues, valor, customSplit]);

  const isSumValid = useMemo(() => {
    if (!customSplit || valor === 0) return true;
    return Math.abs(currentSum - valor) < 0.01;
  }, [currentSum, valor, customSplit]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!descricao.trim() || valor <= 0 || !pagoPorId) return;
    
    if (customSplit && !isSumValid) {
      toast.error('A soma das divisões não bate com o total.');
      return;
    }

    const divisaoItems = [];
    if (customSplit) {
      for (const p of participantes) {
        const val = parseFloat(customValues[p.id]?.replace(',', '.') || '0');
        if (val > 0) {
          divisaoItems.push({ participanteId: p.id, valorDevido: val });
        }
      }
    } else {
      const equalShare = valor / participantes.length;
      for (const p of participantes) {
        divisaoItems.push({ participanteId: p.id, valorDevido: equalShare });
      }
    }

    createDespesa.mutate({
      grupoId,
      data: {
        descricao,
        valor,
        pagoPorId: parseInt(pagoPorId, 10),
        participantes: divisaoItems
      }
    }, {
      onSuccess: () => {
        toast.success('Despesa registrada com sucesso!');
        queryClient.invalidateQueries({ queryKey: getListDespesasQueryKey(grupoId) });
        queryClient.invalidateQueries({ queryKey: getGetSaldoQueryKey(grupoId) });
        setLocation(`/grupo/${grupoId}`);
      },
      onError: () => {
        toast.error('Erro ao registrar despesa.');
      }
    });
  };

  return (
    <div className="min-h-[100dvh] bg-background">
      <header className="bg-card border-b border-border sticky top-0 z-10">
        <div className="px-4 py-4 max-w-xl mx-auto flex items-center gap-3">
          <button 
            onClick={() => setLocation(`/grupo/${grupoId}`)}
            className="p-2 -ml-2 rounded-full hover:bg-muted text-muted-foreground transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-xl font-bold text-foreground">Nova Despesa</h1>
        </div>
      </header>

      <main className="px-4 py-6 max-w-xl mx-auto">
        <form onSubmit={handleSubmit} className="space-y-6">
          <Card className="shadow-none border-border">
            <CardContent className="p-4 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="descricao">O que foi comprado?</Label>
                <Input
                  id="descricao"
                  placeholder="Ex: Jantar no restaurante"
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  autoFocus
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="valor">Valor Total</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-mono">
                    R$
                  </span>
                  <Input
                    id="valor"
                    type="text"
                    inputMode="decimal"
                    placeholder="0.00"
                    className="pl-9 font-mono text-lg font-bold"
                    value={valorStr}
                    onChange={(e) => setValorStr(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Quem pagou?</Label>
                <Select value={pagoPorId} onValueChange={setPagoPorId}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {participantes.map(p => (
                      <SelectItem key={p.id} value={p.id.toString()}>
                        {p.nome} {p.id === participanteId ? '(Você)' : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-none border-border">
            <CardContent className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-foreground">Divisão</h3>
                  <p className="text-sm text-muted-foreground">Como o valor será dividido?</p>
                </div>
                <div className="flex items-center gap-2">
                  <Label htmlFor="custom-split" className="text-sm font-normal">Personalizar</Label>
                  <Switch 
                    id="custom-split" 
                    checked={customSplit} 
                    onCheckedChange={setCustomSplit} 
                  />
                </div>
              </div>

              <div className="space-y-3 pt-2">
                {participantes.map(p => {
                  const equalShare = valor > 0 ? valor / participantes.length : 0;
                  return (
                    <div key={p.id} className="flex items-center justify-between gap-4">
                      <Label className="text-base font-normal truncate flex-1">
                        {p.nome} {p.id === participanteId ? '(Você)' : ''}
                      </Label>
                      {customSplit ? (
                        <div className="relative w-28">
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground text-xs font-mono">
                            R$
                          </span>
                          <Input
                            type="text"
                            inputMode="decimal"
                            className="pl-7 font-mono text-right text-sm"
                            value={customValues[p.id] ?? ''}
                            onChange={(e) => handleCustomValueChange(p.id, e.target.value)}
                            placeholder="0.00"
                          />
                        </div>
                      ) : (
                        <span className="font-mono text-muted-foreground">
                          {formatBRL(equalShare)}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              {customSplit && valor > 0 && (
                <div className={cn(
                  "flex justify-between items-center p-3 mt-4 rounded-md text-sm font-medium",
                  isSumValid ? "bg-accent text-accent-foreground" : "bg-destructive/10 text-destructive"
                )}>
                  <span>Soma das divisões:</span>
                  <span className="font-mono">{formatBRL(currentSum)} / {formatBRL(valor)}</span>
                </div>
              )}
            </CardContent>
          </Card>

          <Button 
            type="submit" 
            className="w-full" 
            size="lg"
            disabled={createDespesa.isPending || !descricao.trim() || valor <= 0 || (customSplit && !isSumValid)}
          >
            {createDespesa.isPending ? 'Registrando...' : 'Registrar Despesa'}
          </Button>
        </form>
      </main>
    </div>
  );
}
