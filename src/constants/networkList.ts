import {Network} from '@app/models';
import {NetworkName} from '.';

import BinanceIcon from '@app/assets/images/logos/binance.svg';
import SmartChainIcon from '@app/assets/images/logos/smartChain.svg';
import EthereumIcon from '@app/assets/images/logos/ethereum.svg';
import PolygonIcon from '@app/assets/images/logos/polygon.svg';
import SolanaIcon from '@app/assets/images/logos/solana.svg';
import ZilliqaIcon from '@app/assets/images/logos/zilliqa.svg';
import AvalancheIcon from '@app/assets/images/logos/avalanche.svg';

export const networkName = {
  [NetworkName.ethereum]: 'Ethereum',
  [NetworkName.polygon]: 'Polygon',
  [NetworkName.binance]: 'Binance',
  [NetworkName.binanceSmartChain]: 'Smart Chain',
  [NetworkName.solana]: 'Solana',
  [NetworkName.zilliqa]: 'Zilliqa',
  [NetworkName.avalanche]: 'Avalanche',
};

export const networkList: Network[] = [
  {
    name: 'Ethereum',
    network: NetworkName.ethereum,
    chainId: {mainnet: 1, testnet: 11155111},
    chain: 'eip155',
    currency: 'ETH',
    Icon: EthereumIcon,
    explorer: 'https://etherscan.io/address',
    layer: 1,
  },
  {
    name: 'Polygon',
    network: NetworkName.polygon,
    chainId: {mainnet: 137, testnet: 80001},
    currency: 'MATIC',
    Icon: PolygonIcon,
    chain: 'eip155',
    explorer: 'https://polygonscan.com/address',
    layer: 2,
  },
  {
    name: 'Avalanche',
    network: NetworkName.avalanche,
    chainId: {mainnet: 43114, testnet: 43113},
    currency: 'AVAX',
    Icon: AvalancheIcon,
    chain: 'eip155',
    explorer: 'https://snowtrace.io/address',
    layer: 1,
  },
  {
    name: 'BNB',
    network: NetworkName.binance,
    currency: 'BNB',
    Icon: BinanceIcon,
    chain: 'bep2',
    explorer: 'https://explorer.binance.org/address',
    layer: 1,
  },
  {
    name: 'Smart Chain',
    network: NetworkName.binanceSmartChain,
    currency: 'BNB',
    Icon: BinanceIcon,
    chain: 'eip155',
    chainId: {mainnet: 56, testnet: 97},
    explorer: 'https://bscscan.com/address',
    layer: 1,
  },
  {
    name: 'Solana',
    network: NetworkName.solana,
    currency: 'SOL',
    Icon: SolanaIcon,
    chain: 'solana',
    chainId: {
      mainnet: '4sGjMW1sUnHzSxGspuhpqLDx6wiyjNtZ',
      testnet: '8E9rvCKLFQia2Y35HXjjpWzj8weVo44K',
    },
    explorer: 'https://solscan.io/account',
    layer: 1,
  },
  {
    name: 'Zilliqa',
    network: NetworkName.zilliqa,
    currency: 'ZIL',
    Icon: ZilliqaIcon,
    chain: 'zip',
    explorer: 'https://viewblock.io/zilliqa/address',
    layer: 1,
  },
];
