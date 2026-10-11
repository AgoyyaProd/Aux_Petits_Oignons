/** Erreur métier typée : le code est stable et testable, le message est destiné à l'utilisateur. */
export class DomainError extends Error {
  constructor(
    readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = new.target.name;
  }
}

/** Deux quantités de dimensions différentes sans conversion connue. Jamais de conversion silencieuse. */
export class IncompatibleUnitError extends DomainError {
  constructor(message: string) {
    super("INCOMPATIBLE_UNIT", message);
  }
}

export class UnknownUnitError extends DomainError {
  constructor(unit: string) {
    super("UNKNOWN_UNIT", `Unité inconnue : « ${unit} ».`);
  }
}

export class InvalidQuantityError extends DomainError {
  constructor(message: string) {
    super("INVALID_QUANTITY", message);
  }
}
