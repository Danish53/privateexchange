/**
 * Manual crypto deposit addresses and QR images.
 * Update addresses and place QR images under public/uploads/crypto-qr/
 */
export const MANUAL_CRYPTO_OPTIONS = [
  {
    id: 'btc',
    name: 'Bitcoin',
    network: 'BTC',
    address: 'bc1qaksr2tvakst4pnzalad2kqkf7eudgl5gxvyxx3',
    qrImage: '/uploads/crypto-qr/btc.jpeg',
  },
  {
    id: 'eth',
    name: 'Ethereum',
    network: 'ERC20',
    address: '0xB0CBea15B002201E2555cdDF425D3feCe7dcacB8',
    qrImage: '/uploads/crypto-qr/eth.jpeg',
  },
  {
    id: 'sol',
    name: 'Solana',
    network: 'SOL',
    address: '3eh852CjDFxGjx8ga35R9eec33JX5mKmtbT7Sqwn6Amv',
    qrImage: '/uploads/crypto-qr/solana.jpeg',
  },
];

const optionById = Object.fromEntries(MANUAL_CRYPTO_OPTIONS.map((o) => [o.id, o]));

export function getManualCryptoOption(id) {
  if (!id || typeof id !== 'string') return null;
  return optionById[id.toLowerCase()] || null;
}

export function listManualCryptoOptionsPublic() {
  return MANUAL_CRYPTO_OPTIONS.map(({ id, name, network, address, qrImage }) => ({
    id,
    name,
    network,
    address,
    qrImage,
  }));
}

export const MANUAL_CRYPTO_IDS = MANUAL_CRYPTO_OPTIONS.map((o) => o.id);

/** BTC / ETH / SOL label for deposit history */
export function getCryptoDepositTokenLabel(payCurrency) {
  const id = String(payCurrency || '').trim().toLowerCase();
  if (!id) return '';
  const opt = getManualCryptoOption(id);
  if (opt) return id.toUpperCase();
  return id.toUpperCase();
}
