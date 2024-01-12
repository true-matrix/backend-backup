const attachIoToRequest = (io) => (req, res, next) => {
  req.io = io;
  next();
};

module.exports = { attachIoToRequest };
