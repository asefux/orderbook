const order = {
  sides: {
    BUY: 'BUY',
    SELL: 'SELL',
  },
};


const orderbook = {
  events: {
    orderFilled: 'order-filled',
    orderPartiallyFilled: 'order-partially-filled',
    orderPosted: 'order-posted',
    orderCancel: 'order-cancel',
    tradeExecuted: 'trade-executed',

  },
  actions: {
    post: 'post',
    cancel: 'cancel',
  },
};


module.exports = {
  order,
  sides: order.sides,
  orderbook,
};
