const STORAGE_PREFIX = "veetu_rusi_saved_addresses";

const normalizeValue = (value) => (value || "").toString().trim();

const normalizeAddress = (address = {}) => ({
  id: address.id || `address-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  user_id: address.user_id || "",
  customer_name: normalizeValue(address.customer_name),
  customer_email: normalizeValue(address.customer_email),
  customer_phone: normalizeValue(address.customer_phone),
  street_address: normalizeValue(address.street_address),
  city: normalizeValue(address.city),
  district: normalizeValue(address.district),
  state: normalizeValue(address.state),
  country: normalizeValue(address.country || "India"),
  zip_code: normalizeValue(address.zip_code),
});

export const getAddressStorageKey = (userId) => `${STORAGE_PREFIX}_${userId || "guest"}`;

export const readUserAddresses = (userId) => {
  if (typeof window === "undefined") return [];

  try {
    const key = getAddressStorageKey(userId);
    const raw = window.localStorage.getItem(key);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map(normalizeAddress) : [];
  } catch (error) {
    console.error("Failed to read saved addresses", error);
    return [];
  }
};

export const saveUserAddresses = (userId, addresses = []) => {
  if (typeof window === "undefined") return [];

  const normalized = (Array.isArray(addresses) ? addresses : [])
    .map(normalizeAddress)
    .filter((address) => address.user_id === (userId || "") || !address.user_id);

  try {
    window.localStorage.setItem(getAddressStorageKey(userId), JSON.stringify(normalized));
    return normalized;
  } catch (error) {
    console.error("Failed to save saved addresses", error);
    return normalized;
  }
};

export const isSameAddress = (a = {}, b = {}) => {
  const first = normalizeAddress(a);
  const second = normalizeAddress(b);

  return [
    first.customer_name,
    first.customer_email,
    first.customer_phone,
    first.street_address,
    first.city,
    first.district,
    first.state,
    first.country,
    first.zip_code,
  ].join("|") === [
    second.customer_name,
    second.customer_email,
    second.customer_phone,
    second.street_address,
    second.city,
    second.district,
    second.state,
    second.country,
    second.zip_code,
  ].join("|");
};

export const upsertUserAddress = (userId, address) => {
  const normalized = normalizeAddress({ ...address, user_id: userId });
  const existing = readUserAddresses(userId);
  const deduped = existing.filter((item) => !isSameAddress(item, normalized));
  const next = [normalized, ...deduped];
  return saveUserAddresses(userId, next);
};

export const removeUserAddress = (userId, addressId) => {
  const existing = readUserAddresses(userId);
  const next = existing.filter((address) => address.id !== addressId);
  return saveUserAddresses(userId, next);
};
