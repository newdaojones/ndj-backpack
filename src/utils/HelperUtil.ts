import {Wallet} from '@app/models';
import {utils} from 'ethers';

/**
 * Truncates string (in the middle) via given lenght value
 */
export function truncate(value: string, length: number) {
  if (value?.length <= length) {
    return value;
  }

  const separator = '...';
  const stringLength = length - separator.length;
  const frontLength = Math.ceil(stringLength / 2);
  const backLength = Math.floor(stringLength / 2);

  return (
    value.substring(0, frontLength) +
    separator +
    value.substring(value.length - backLength)
  );
}

/**
 * Converts hex to utf8 string if it is valid bytes
 */
export function convertHexToUtf8(value: string) {
  try {
    if (utils.isHexString(value)) {
      return utils.toUtf8String(value);
    }

    return value;
  } catch (err) {
    return value;
  }
}

/**
 * Gets message from various signing request methods by filtering out
 * a value that is not an address (thus is a message).
 * If it is a hex string, it gets converted to utf8 string
 */
export function getSignParamsMessage(params: string[]) {
  const message = params.filter(p => !utils.isAddress(p))[0];

  return convertHexToUtf8(message);
}

export function getSignParamsAddress(params: string[]) {
  return params.filter(p => utils.isAddress(p))[0];
}

/**
 * Gets data from various signTypedData request methods by filtering out
 * a value that is not an address (thus is data).
 * If data is a string convert it to object
 */
export function getSignTypedDataParamsData(params: string[]) {
  const data = params.filter(p => !utils.isAddress(p))[0];

  if (typeof data === 'string') {
    return JSON.parse(data);
  }

  return data;
}

/**
 * Get our address from params checking if params string contains one
 * of our wallet addresses
 */
export function getWalletAddressFromParams(addresses: string[], params: any) {
  const paramsString = JSON.stringify(params);
  let address = '';

  addresses.forEach(addr => {
    if (paramsString.includes(addr)) {
      address = addr;
    }
  });

  return address;
}

export function getPrivateKeyByParams(wallets: Wallet[], params: any) {
  const request = params[0];
  const fromAddress = request?.from?.toLowerCase();
  const paramsString = JSON.stringify(params);

  for (const account of wallets) {
    for (const wallet of account.wallets) {
      if (fromAddress) {
        if (fromAddress === wallet.address.toLowerCase()) {
          return wallet.privateKey;
        }
      } else {
        if (paramsString.toLowerCase().includes(wallet.address.toLowerCase())) {
          return wallet.privateKey;
        }
      }
    }
  }

  return null;
}

export function getAddressByParams(wallets: Wallet[], params: any) {
  const request = params[0];
  const fromAddress = request?.from;
  const paramsString = JSON.stringify(params);

  for (const account of wallets) {
    for (const wallet of account.wallets) {
      if (fromAddress) {
        if (fromAddress === wallet.address) {
          return wallet.address;
        }
      } else {
        if (paramsString.includes(wallet.address)) {
          return wallet.address;
        }
      }
    }
  }

  return null;
}

/**
 * Check if chain is part of EIP155 standard
 */
export function isEIP155Chain(chain: string) {
  return chain.includes('eip155');
}

/**
 * Check if chain is part of COSMOS standard
 */
export function isCosmosChain(chain: string) {
  return chain.includes('cosmos');
}
