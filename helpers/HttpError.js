const errorMessageList = {
  400: "BadRequest",
  401: "Unauthorized",
  403: "forbidden",
  404: "Not found",
  409: "Conflict",
};

const HttpError = (status, message = errorMessageList[status]) => {
  const error = new Error(message);
  error.status = status;
  return error;
};

module.exports = HttpError;
