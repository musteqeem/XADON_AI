// Compatibility shim for legacy media-effect command imports.
const applyEffect = async (buffer) => buffer;
const getTargetBuffer = async (sock, m) => {
  if (m?.download) return m.download();
  return null;
};
module.exports = { applyEffect, getTargetBuffer };
