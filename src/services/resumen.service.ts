import db from '../config/db';
import dayjs from 'dayjs';
import groupBy from 'lodash.groupby';

export async function calcularResumenDiario(fecha: string): Promise<void> {
  const desde = `${fecha} 00:00:00`;
  const hasta = `${fecha} 23:59:59`;

  const [rows]: any[] = await db.execute(
    `
    SELECT
      registro_historico_plate AS placa,
      registro_historico_driver AS conductor,
      registro_historico_read_date,
      registro_historico_speed,
      registro_historico_empresa
    FROM registro_historico
    WHERE registro_historico_read_date BETWEEN ? AND ?
    ORDER BY registro_historico_plate, registro_historico_driver, registro_historico_read_date
    `,
    [desde, hasta]
  );

  const agrupado = groupBy(rows, row => `${row.placa}::${row.conductor}`);

  for (const [key, eventos] of Object.entries(agrupado)) {
    let segundosMovimiento = 0;
    let segundosDetenido = 0;

    const [placa, rawConductor] = key.split('::');

    // ✅ Mejora 1: normalizar conductor a NULL si viene vacío o 'null'
    const conductor = (!rawConductor || rawConductor.toLowerCase() === 'null') ? 'Sin Conductor' : rawConductor;
    const empresa = eventos[0].registro_historico_empresa || null;

    for (let i = 1; i < eventos.length; i++) {
      const prev = eventos[i - 1];
      const curr = eventos[i];

      const diff = dayjs(curr.registro_historico_read_date).diff(
        dayjs(prev.registro_historico_read_date),
        'second'
      );

      if (diff > 0 && diff < 600) {
        const moving = prev.registro_historico_speed > 5 && curr.registro_historico_speed > 5;
        if (moving) {
          segundosMovimiento += diff;
        } else {
          segundosDetenido += diff;
        }
      }
    }

    // ✅ Mejora 2: usar INSERT ... ON DUPLICATE KEY UPDATE
    await db.execute(
      `
      INSERT INTO resumen_conduccion_diaria 
      (fecha, placa, conductor, minutos_conduccion, minutos_detencion, empresa)
      VALUES (?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        minutos_conduccion = VALUES(minutos_conduccion),
        minutos_detencion = VALUES(minutos_detencion),
        empresa = VALUES(empresa)
      `,
      [
        fecha,
        placa,
        conductor,
        Math.round(segundosMovimiento / 60),
        Math.round(segundosDetenido / 60),
        empresa
      ]
    );
  }
}
