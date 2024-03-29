import {BaseCoin} from '@app/models';
import axios from 'axios';
import {setupCache} from 'axios-cache-adapter';
const cache = setupCache({
  maxAge: 2 * 60 * 1000,
  exclude: {query: false},
});
const Axios = axios.create({
  baseURL: 'https://api.coingecko.com/api/v3',
  adapter: cache.adapter,
});

export const getCoinGeckoCoinList = async () => {
  const {data} = await Axios.get('/coins/list', {
    params: {
      include_platform: true,
    },
  });

  return data;
};

export const getCoinGeckoDetail = async (
  baseCoins: BaseCoin[],
  currency: string = 'usd',
) => {
  const {data} = await Axios.get('/coins/markets', {
    params: {
      vs_currency: currency,
      ids: baseCoins.map(b => b.id).join(','),
      sparkline: false,
      per_page: 100,
      page: 1,
    },
  });

  return data;
};

export const getCoinGeckoData = async (id: string) => {
  const {data} = await Axios.get(`/coins/${id}`);

  return data;
};

export const getCoinGeckoMarketChart = async (
  id: string,
  days: number | 'max',
  currency: string = 'usd',
) => {
  const {data} = await Axios.get(
    `/coins/${id}/market_chart?vs_currency=${currency}&days=${days}`,
  );

  return data;
};

export const getCoinGeckoSupportCurrencies = async () => {
  const {data} = await Axios.get('/simple/supported_vs_currencies');

  return data;
};
