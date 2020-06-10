// Template for generating a response

export default function responseBuilder(err: string | null, response?: object): string {
  if (err) {
    return JSON.stringify({
      success: 0,
      message: err
    });
  }

  return JSON.stringify({
    success: 1,
    ...response
  });
};
