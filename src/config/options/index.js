const order = {
  decimals: {
    price: 8, volume: 8,
  },
};

const orderbook = {
  priceDecimals: 2,
  volumeDecimals: 8,
  priceStep: 0.01,
  maxNumberOfOrdersPerSide: 10000,
  maxLockWaitTime: 4000,
  fee: 0.002,
};

const trade = {
  decimals: { price: 8, volume: 8 },
};

module.exports = {
  order,
  orderbook,
  trade,
};
