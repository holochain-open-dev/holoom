import { ValidationRejectionDetail } from "./typeshare-generated";

export class ValidationError extends Error {
  constructor(
    message: string,
    readonly detail: ValidationRejectionDetail
  ) {
    super(message);
  }

  static tryCast(error: Error): Error {
    if (error.message.includes("InvalidCommit")) {
      const fail = () => {
        console.error(
          `Badly formed invalid commit reasons message: ${error.message}`
        );
        return error;
      };
      const parts1 = error.message.split("__REASONS_START__");
      if (parts1.length !== 2) return fail();
      const parts2 = parts1[1].split("__REASONS_END__");
      if (parts2.length !== 2) return fail();
      try {
        const detail = JSON.parse(parts2[0]);
        return new ValidationError(error.message, detail);
      } catch {
        return fail();
      }
    }
    return error;
  }

  static tryCastThrow(error: Error): never {
    throw ValidationError.tryCast(error);
  }

  static getDetail(error: unknown) {
    if (error instanceof ValidationError) {
      return error.detail;
    }
  }
}
