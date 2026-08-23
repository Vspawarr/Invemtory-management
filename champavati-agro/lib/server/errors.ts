export class UnauthenticatedError extends Error {
  constructor(message = "You need to sign in to continue.") {
    super(message);
    this.name = "UnauthenticatedError";
  }
}

export class ForbiddenError extends Error {
  constructor(message = "You don't have access to this.") {
    super(message);
    this.name = "ForbiddenError";
  }
}

/** Maps a thrown error to a friendly message safe to show the user; logs the rest. */
export function toFriendlyMessage(error: unknown): string {
  if (error instanceof UnauthenticatedError) return error.message;
  if (error instanceof ForbiddenError) return error.message;
  console.error(error);
  return "Something went wrong on our end. Please try again.";
}
