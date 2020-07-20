// Template for generating a response
// TODO this should be imported from the xxGuestAPI as messageFactory

export function responseBuilder(err: string | null, response?: object): string {
  if (err) {
    return JSON.stringify({
      success: 0,
      error: err
    });
  }

  return JSON.stringify({
    success: 1,
    ...response
  });
};
