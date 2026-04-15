/**
 * Network Guard Middleware
 * Validates that the client IP belongs to an allowed campus subnet
 * before permitting attendance-related write operations.
 */

// Allowed subnet prefixes (college WiFi ranges)
const ALLOWED_SUBNETS = ['192.168.1.', '10.0.0.'];

// Always allow localhost for development
const LOCALHOST_IPS = ['127.0.0.1', '::1', '::ffff:127.0.0.1'];

function extractClientIp(req) {
  // Support proxied environments (Render, etc.)
  const forwarded = req.headers['x-forwarded-for'];
  let ip = forwarded ? forwarded.split(',')[0].trim() : req.socket.remoteAddress;

  // Strip IPv6-mapped IPv4 prefix
  if (ip && ip.startsWith('::ffff:')) {
    ip = ip.substring(7);
  }

  return ip || 'unknown';
}

function networkGuard(req, res, next) {
  const clientIp = extractClientIp(req);

  // Allow localhost in all environments for development/testing
  if (LOCALHOST_IPS.includes(clientIp) || LOCALHOST_IPS.includes(req.socket.remoteAddress)) {
    req.clientIp = clientIp;
    return next();
  }

  // Check if IP falls within any allowed subnet
  const isAllowed = ALLOWED_SUBNETS.some(subnet => clientIp.startsWith(subnet));

  if (!isAllowed) {
    return res.status(403).json({
      success: false,
      error: 'Network access denied',
      message: 'Attendance can only be marked from the college campus network.',
      clientIp,
      requiredNetwork: ALLOWED_SUBNETS.map(s => s + 'x').join(' or ')
    });
  }

  req.clientIp = clientIp;
  next();
}

module.exports = networkGuard;
