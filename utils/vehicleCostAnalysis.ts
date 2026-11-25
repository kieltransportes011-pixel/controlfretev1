import { Expense, MaintenanceLog, OdometerReading } from '../types';

// Consumo medio (km/L): metodo "cheio a cheio" - usa o litro do
// abastecimento MAIS RECENTE de cada intervalo dividido pelo KM percorrido
// desde o abastecimento anterior. So entra no calculo quem tem litros E KM
// informados (abastecimento antigo sem esses dados e ignorado, nunca
// presumido).
export interface ConsumptionResult {
  avgKmPerLiter: number | null;
  intervalsUsed: number;
  reason?: string;
}

export function calculateAverageConsumption(fuelExpenses: Expense[]): ConsumptionResult {
  const usable = fuelExpenses
    .filter(e => e.liters && e.liters > 0 && e.odometer_km != null)
    .sort((a, b) => (a.odometer_km as number) - (b.odometer_km as number));

  if (usable.length < 2) {
    return {
      avgKmPerLiter: null,
      intervalsUsed: 0,
      reason: 'Registre pelo menos 2 abastecimentos com litros e KM informados pra calcular o consumo médio.',
    };
  }

  let totalKm = 0;
  let totalLiters = 0;
  let intervalsUsed = 0;
  for (let i = 1; i < usable.length; i++) {
    const kmDiff = (usable[i].odometer_km as number) - (usable[i - 1].odometer_km as number);
    if (kmDiff <= 0) continue; // leitura inconsistente - ignora o intervalo, nao quebra o calculo
    totalKm += kmDiff;
    totalLiters += usable[i].liters as number;
    intervalsUsed++;
  }

  if (intervalsUsed === 0 || totalLiters === 0) {
    return {
      avgKmPerLiter: null,
      intervalsUsed: 0,
      reason: 'As leituras de KM entre abastecimentos não avançam de forma consistente.',
    };
  }

  return { avgKmPerLiter: totalKm / totalLiters, intervalsUsed };
}

// Custo por KM num periodo: distancia vem das leituras de odometro (Fase 2)
// dentro do periodo - nao presume nada fora da janela. Custos separados por
// origem pra nunca somar a mesma despesa duas vezes.
export interface PeriodCostResult {
  distanceKm: number | null;
  fuelCost: number;
  maintenanceCost: number;
  otherCost: number;
  costPerKm: number | null;
  reason?: string;
}

export function calculatePeriodCost(params: {
  readings: OdometerReading[];
  maintenanceLogs: MaintenanceLog[];
  expenses: Expense[];
  start: Date;
  end: Date;
}): PeriodCostResult {
  const { readings, maintenanceLogs, expenses, start, end } = params;
  const inRange = (dateStr: string) => {
    const t = new Date(dateStr).getTime();
    return t >= start.getTime() && t <= end.getTime();
  };

  const readingsInRange = readings
    .filter(r => inRange(r.reading_date))
    .sort((a, b) => new Date(a.reading_date).getTime() - new Date(b.reading_date).getTime());

  let distanceKm: number | null = null;
  let reason: string | undefined;
  if (readingsInRange.length < 2) {
    reason = 'Sem leituras de KM suficientes nesse período pra calcular a distância percorrida.';
  } else {
    const dist = readingsInRange[readingsInRange.length - 1].km - readingsInRange[0].km;
    if (dist > 0) {
      distanceKm = dist;
    } else {
      reason = 'As leituras de KM no período não avançam de forma consistente.';
    }
  }

  const maintenanceCost = maintenanceLogs.filter(l => inRange(l.date)).reduce((acc, l) => acc + l.cost, 0);
  const fuelCost = expenses.filter(e => e.category === 'FUEL' && inRange(e.date)).reduce((acc, e) => acc + e.value, 0);
  const otherCost = expenses.filter(e => e.category !== 'FUEL' && inRange(e.date)).reduce((acc, e) => acc + e.value, 0);

  const costPerKm = distanceKm ? (fuelCost + maintenanceCost + otherCost) / distanceKm : null;

  return { distanceKm, fuelCost, maintenanceCost, otherCost, costPerKm, reason: distanceKm ? undefined : reason };
}
