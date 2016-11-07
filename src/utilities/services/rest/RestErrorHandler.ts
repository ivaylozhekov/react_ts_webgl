export const enum ErrorTypes {
  GENERIC,
  UNAUTHORIZED,
  SERVICE,
}

export const RestErrorHandler = (error) => {

  let response = {
    type: null,
    message: null,
    service: null,
  };

  switch (error.status) {
    case 401:
      response.type = ErrorTypes.UNAUTHORIZED;
      break;
    case 500:
    case 502:
      response.type = ErrorTypes.SERVICE;
      break;
    default:
      response.type = ErrorTypes.GENERIC;
  }

  if (error.data.message) response.message = error.data.message;
  if (error.data.reason) response.service = error.data.reason === 'UNKNOWN' ? 'rest' : error.data.reason;

  return {error: response};

};
