// Billetera (api-wallet / WIBOND) para probar la sección Billetera de mo-ng-micuenta sin depender de una cuenta
// aprobada en staging ni del saldo real. Va delante del gateway local: estas rutas responden acá y el resto de /v1/*
// sigue al LOCAL_GATEWAY_FALLBACK.

// Mismos códigos que `BilleteraCuentaEstado` del front.
export const ESTADOS_CUENTA: Record<number, string> = {
  1: "Pendiente",
  2: "Aprobado",
  3: "Faltan documentos",
  4: "Rechazado",
  5: "Suspendido",
};

export interface EscenarioBilletera {
  balance: number;
  codBilleteraCuentaEstado: number;
  cvu: string;
  alias: string;
}

export class BilleteraService {
  private escenario: EscenarioBilletera = {
    balance: Number(process.env.MOCK_BILLETERA_SALDO ?? 1234567.89),
    codBilleteraCuentaEstado: 2,
    cvu: "0000003100012345678901",
    alias: "MAXI.PRUEBA.MOCK",
  };

  obtenerEscenario(): EscenarioBilletera {
    return { ...this.escenario };
  }

  /** Cambia el saldo o el estado del alta sin reiniciar (PUT /mock/billetera). */
  actualizarEscenario(cambios: Partial<EscenarioBilletera>): EscenarioBilletera {
    if (cambios.balance !== undefined) this.escenario.balance = Number(cambios.balance);
    if (cambios.codBilleteraCuentaEstado !== undefined) {
      this.escenario.codBilleteraCuentaEstado = Number(cambios.codBilleteraCuentaEstado);
    }
    if (cambios.cvu !== undefined) this.escenario.cvu = cambios.cvu;
    if (cambios.alias !== undefined) this.escenario.alias = cambios.alias;
    return this.obtenerEscenario();
  }

  private aprobada(): boolean {
    return this.escenario.codBilleteraCuentaEstado === 2;
  }

  estado() {
    return { activo: true, codProvider: 1, nombre: "WIBOND" };
  }

  cuentas() {
    const aprobada = this.aprobada();
    return [
      {
        codBilleteraCuenta: 1,
        nombreBilletera: "MaxiPay",
        cuentaExternaId: "mock-wibond-1",
        cvu: aprobada ? this.escenario.cvu : null,
        alias: aprobada ? this.escenario.alias : null,
        aliasUltimaModificacion: null,
        codBilleteraCuentaEstado: this.escenario.codBilleteraCuentaEstado,
        estadoDescripcion: ESTADOS_CUENTA[this.escenario.codBilleteraCuentaEstado] ?? "Desconocido",
        puedeModificarAlias: true,
        horasRestantesAlias: 0,
        fechaAlta: "2026-10-01T10:00:00",
      },
    ];
  }

  /** null = la cuenta no está aprobada: el back responde 409. */
  saldo() {
    if (!this.aprobada()) return null;
    return { balance: this.escenario.balance, currency: "ARS", cvu: this.escenario.cvu, alias: this.escenario.alias };
  }

  movimientos(filter: string | undefined) {
    return {
      movimientos: [],
      cvu: this.escenario.cvu,
      alias: this.escenario.alias,
      filter: filter ?? "Ultimos 15 dias",
      transferenciasDisponibles: true,
    };
  }
}
