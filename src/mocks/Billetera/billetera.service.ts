// Billetera (api-wallet / WIBOND) para probar la sección Billetera de mo-ng-micuenta sin depender de una cuenta
// aprobada en staging ni del saldo real. Va delante del gateway local y atiende TODO apibilletera: las consultas y las
// acciones (transferir, alias, sincronizar...) responden acá, y lo que no está mockeado da 501. Nada de la billetera se
// reenvía a staging, así la pantalla nunca mezcla la cuenta del mock con escrituras sobre una cuenta real.

// Mismos códigos que `BilleteraCuentaEstado` del front.
export const ESTADOS_CUENTA: Record<number, string> = {
  1: "Pendiente",
  2: "Aprobado",
  3: "Faltan documentos",
  4: "Rechazado",
  5: "Suspendido",
};

const SALDO_POR_DEFECTO = 1234567.89;
const ALIAS_VALIDO = /^[A-Za-z0-9.-]{6,20}$/;
const CVU_VALIDO = /^\d{22}$/;

export interface EscenarioBilletera {
  balance: number;
  codBilleteraCuentaEstado: number;
  cvu: string;
  alias: string;
}

export type Resultado<T> = { ok: true; valor: T } | { ok: false; errores: string[] };

/** Saldo inicial de MOCK_BILLETERA_SALDO: número con punto decimal (1234567.89). Si no es válido, el de por defecto. */
const saldoInicial = (): number => {
  const crudo = process.env.MOCK_BILLETERA_SALDO;
  if (crudo === undefined || crudo.trim() === "") return SALDO_POR_DEFECTO;
  const saldo = Number(crudo);
  if (Number.isFinite(saldo) && saldo >= 0) return saldo;
  console.warn(`MOCK_BILLETERA_SALDO inválido (${crudo}): se usa ${SALDO_POR_DEFECTO}. Formato: 1234567.89`);
  return SALDO_POR_DEFECTO;
};

const enmascarar = (cuenta: string): string => (cuenta.length > 8 ? `${cuenta.slice(0, 4)}...${cuenta.slice(-4)}` : cuenta);

export class BilleteraService {
  private escenario: EscenarioBilletera = {
    balance: saldoInicial(),
    codBilleteraCuentaEstado: 2,
    cvu: "0000003100012345678901",
    alias: "MAXI.PRUEBA.MOCK",
  };
  private transacciones = 0;

  obtenerEscenario(): EscenarioBilletera {
    return { ...this.escenario };
  }

  /**
   * Cambia el saldo, el estado del alta, el CVU o el alias sin reiniciar (PUT /mock/billetera). Valida todo antes de
   * tocar nada: si un campo está mal no se aplica ninguno.
   */
  actualizarEscenario(cambios: unknown): Resultado<EscenarioBilletera> {
    if (cambios === null || typeof cambios !== "object" || Array.isArray(cambios)) {
      return { ok: false, errores: ["El cuerpo tiene que ser un objeto JSON"] };
    }
    const c = cambios as Record<string, unknown>;
    const errores: string[] = [];
    const conocidos = ["balance", "codBilleteraCuentaEstado", "cvu", "alias"];
    for (const campo of Object.keys(c)) {
      if (!conocidos.includes(campo)) errores.push(`Campo desconocido: ${campo} (válidos: ${conocidos.join(", ")})`);
    }
    if (c.balance !== undefined && !(typeof c.balance === "number" && Number.isFinite(c.balance) && c.balance >= 0)) {
      errores.push("balance tiene que ser un número >= 0 (ej. 1234567.89)");
    }
    if (
      c.codBilleteraCuentaEstado !== undefined &&
      !(Number.isInteger(c.codBilleteraCuentaEstado) && ESTADOS_CUENTA[c.codBilleteraCuentaEstado as number])
    ) {
      errores.push("codBilleteraCuentaEstado tiene que ser un entero de 1 a 5 (1 Pendiente, 2 Aprobado, ...)");
    }
    if (c.cvu !== undefined && !(typeof c.cvu === "string" && CVU_VALIDO.test(c.cvu))) {
      errores.push("cvu tiene que ser un string de 22 dígitos");
    }
    if (c.alias !== undefined && !(typeof c.alias === "string" && ALIAS_VALIDO.test(c.alias))) {
      errores.push("alias tiene que tener de 6 a 20 caracteres: letras, números, punto o guion");
    }
    if (errores.length) return { ok: false, errores };

    this.escenario = { ...this.escenario, ...(c as Partial<EscenarioBilletera>) };
    return { ok: true, valor: this.obtenerEscenario() };
  }

  aprobada(): boolean {
    return this.escenario.codBilleteraCuentaEstado === 2;
  }

  private descripcionEstado(): string {
    return ESTADOS_CUENTA[this.escenario.codBilleteraCuentaEstado] ?? "Desconocido";
  }

  // ── Consultas ──

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
        estadoDescripcion: this.descripcionEstado(),
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

  onboardingUrl(urlBase: string) {
    return { url: `${urlBase}/mock/billetera` };
  }

  // ── Acciones ──

  activar() {
    return { codBilleteraProvider: 1, nombreProvider: "WIBOND", mensaje: "Billetera activada (mock)" };
  }

  /** Como el back: sincronizar siempre da 200 y lo que decide es el estado que vuelve. */
  sincronizar(codBilleteraCuenta: number) {
    const aprobada = this.aprobada();
    return {
      codBilleteraCuenta,
      cvu: aprobada ? this.escenario.cvu : null,
      alias: aprobada ? this.escenario.alias : null,
      codBilleteraCuentaEstado: this.escenario.codBilleteraCuentaEstado,
      estadoDescripcion: this.descripcionEstado(),
      sincronizado: true,
      camposActualizados: [],
    };
  }

  modificarAlias(codBilleteraCuenta: number, alias: unknown): Resultado<object> {
    if (!(typeof alias === "string" && ALIAS_VALIDO.test(alias))) {
      return { ok: false, errores: ["El alias tiene que tener de 6 a 20 caracteres: letras, números, punto o guion"] };
    }
    this.escenario.alias = alias;
    return {
      ok: true,
      valor: {
        codBilleteraCuenta,
        alias,
        aliasUltimaModificacion: new Date().toISOString().slice(0, 19),
        mensaje: "Alias modificado (mock)",
      },
    };
  }

  /** Destino de una transferencia: siempre una cuenta propia (mismo CUIT), que es lo único que WIBOND deja usar. */
  destino(aliasCvu: string | undefined): Resultado<object> {
    const valor = (aliasCvu ?? "").trim();
    if (!valor) return { ok: false, errores: ["Falta aliasCvu"] };
    const esNumero = /^\d{22}$/.test(valor);
    return {
      ok: true,
      valor: {
        titular: "MAXIREST PRUEBA SA",
        tipoDocumento: "CUIT",
        numeroDocumento: "30999999993",
        personaFisica: false,
        banco: "Banco Mock",
        tipoCuenta: "CC",
        moneda: "ARS",
        alias: esNumero ? null : valor,
        cbu: esNumero ? valor : null,
        cvu: null,
        mismoTitular: true,
      },
    };
  }

  /** 202 PENDIENTE, y el saldo baja en el acto (en WIBOND baja cuando se procesa; para probar la pantalla alcanza). */
  cashout(cuerpo: unknown): Resultado<object> {
    const c = (cuerpo ?? {}) as Record<string, unknown>;
    const monto = c.monto;
    const destino = c.destino;
    if (!(typeof monto === "number" && Number.isFinite(monto) && monto >= 0.01 && monto <= 9999999.99)) {
      return { ok: false, errores: ["monto tiene que ser un número de 0,01 a 9.999.999,99"] };
    }
    if (!(typeof destino === "string" && destino.trim())) {
      return { ok: false, errores: ["Falta destino"] };
    }
    if (monto > this.escenario.balance) {
      return { ok: false, errores: ["Saldo insuficiente (mock)"] };
    }
    this.escenario.balance = Math.round((this.escenario.balance - monto) * 100) / 100;
    this.transacciones += 1;
    return {
      ok: true,
      valor: {
        codBilleteraTransaccion: `mock-${this.transacciones}`,
        estado: "PENDIENTE",
        importe: monto,
        destino: enmascarar(destino.trim()),
        mensaje: "Transferencia en proceso (mock)",
      },
    };
  }
}
