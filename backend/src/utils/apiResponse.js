const apiResponse = (res, { status = 200, message = '', data = {} }) => {
  const payload = message ? { message, ...data } : { ...data };
  return res.status(status).json(payload);
};

module.exports = { apiResponse };
