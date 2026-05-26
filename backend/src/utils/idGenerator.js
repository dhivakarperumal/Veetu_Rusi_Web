const crypto = require('crypto');

function generateUUID() {
  return crypto.randomUUID();
}

function generateRoleId(role) {
  const uuid = generateUUID();
  switch (role) {
    case 'superadmin':
      return `SUPER-${uuid}`;
    case 'franchise_admin':
      return `FRAN-${uuid}`;
    case 'restaurant':
      return `REST-${uuid}`;
    case 'chef':
      return `CHEF-${uuid}`;
    case 'delivery_partner':
    case 'delivery_boy':
      return `DEL-${uuid}`;
    default:
      return `USER-${uuid}`;
  }
}

module.exports = {
  generateUUID,
  generateRoleId
};
