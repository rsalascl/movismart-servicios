import dayjs from 'dayjs';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import { calcularResumenDiario } from '../services/resumen.service';

dayjs.extend(isSameOrBefore);

const [, , argDesde, argHasta] = process.argv;

let fechaDesde: dayjs.Dayjs;
let fechaHasta: dayjs.Dayjs;

if (!argDesde) {
  // 🕓 Modo 1: sin argumentos → usa el día anterior
  const ayer = dayjs().subtract(1, 'day');
  fechaDesde = ayer;
  fechaHasta = ayer;
  console.log(`[CRON] Modo automático: procesando fecha de ayer: ${ayer.format('YYYY-MM-DD')}`);
} else {
  // 📅 Modo 2: argumentos desde/hasta
  fechaDesde = dayjs(argDesde, 'YYYY-MM-DD', true);
  fechaHasta = dayjs(argHasta || argDesde, 'YYYY-MM-DD', true);

  if (!fechaDesde.isValid() || !fechaHasta.isValid()) {
    console.error('[CRON] Fechas inválidas. Usa formato: YYYY-MM-DD YYYY-MM-DD');
    process.exit(1);
  }

  console.log(`[CRON] Modo manual: procesando desde ${fechaDesde.format('YYYY-MM-DD')} hasta ${fechaHasta.format('YYYY-MM-DD')}`);
}

(async () => {
  try {
    let fechaActual = fechaDesde;

    while (fechaActual.isSameOrBefore(fechaHasta)) {
      const fechaStr = fechaActual.format('YYYY-MM-DD');
      console.log(`[CRON] Procesando resumen diario para: ${fechaStr}`);
      await calcularResumenDiario(fechaStr);
      fechaActual = fechaActual.add(1, 'day');
    }

    console.log('[CRON] Proceso finalizado correctamente.');
    process.exit(0);
  } catch (err) {
    console.error('[CRON] Error durante la ejecución:', err);
    process.exit(1);
  }
})();
