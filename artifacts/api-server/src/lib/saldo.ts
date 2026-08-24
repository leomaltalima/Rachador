import type { Participante } from "@workspace/db";

interface DivisaoSaldo {
  participanteId: number;
  valorDevido: number;
  pagoPorId: number;
  quitado: boolean;
}

interface Transferencia {
  fromId: number;
  toId: number;
  valor: number;
}

export function calcularTransferencias(
  participantes: Participante[],
  divisoes: DivisaoSaldo[],
): Transferencia[] {
  const balance = new Map<number, number>();

  for (const p of participantes) {
    balance.set(p.id, 0);
  }

  for (const d of divisoes) {
    if (d.quitado || d.participanteId === d.pagoPorId) continue;
    const valorNum = d.valorDevido;
    balance.set(d.participanteId, (balance.get(d.participanteId) ?? 0) - valorNum);
    balance.set(d.pagoPorId, (balance.get(d.pagoPorId) ?? 0) + valorNum);
  }

  const creditors: Array<{ id: number; amount: number }> = [];
  const debtors: Array<{ id: number; amount: number }> = [];

  for (const [id, amount] of balance.entries()) {
    if (amount > 0.005) creditors.push({ id, amount });
    else if (amount < -0.005) debtors.push({ id, amount: -amount });
  }

  creditors.sort((a, b) => b.amount - a.amount);
  debtors.sort((a, b) => b.amount - a.amount);

  const transfers: Transferencia[] = [];
  let i = 0;
  let j = 0;

  while (i < debtors.length && j < creditors.length) {
    const debtor = debtors[i];
    const creditor = creditors[j];
    const amount = Math.min(debtor.amount, creditor.amount);

    transfers.push({
      fromId: debtor.id,
      toId: creditor.id,
      valor: Math.round(amount * 100) / 100,
    });

    debtor.amount -= amount;
    creditor.amount -= amount;

    if (debtor.amount < 0.005) i++;
    if (creditor.amount < 0.005) j++;
  }

  return transfers;
}
