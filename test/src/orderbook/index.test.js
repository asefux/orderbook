const { uuid } = require('@asefux/common');

const Orderbook = require('../../../src/orderbook');
const Order = require('../../../src/order');

const { enums: { sides, orderbook: { events, actions } } } = require('../../../src/config');

describe('Orderbook actions', () => {
  it('should submit a BUY order', async () => {
    const mockOrderUuid = uuid.v1();
    const mockOrder = Order.create({
      id: mockOrderUuid,
      side: sides.BUY,
      price: 1.00,
      volume: 100,
    });
    const orderbook = Orderbook.create();
    const orderFilled = jest.fn();
    const orderPartiallyFilled = jest.fn();
    const orderPosted = jest.fn();
    const tradeExecuted = jest.fn();

    orderbook.on(events.orderFilled, orderFilled);
    orderbook.on(events.orderPartiallyFilled, orderPartiallyFilled);
    orderbook.on(events.orderPosted, orderPosted);
    orderbook.on(events.tradeExecuted, tradeExecuted);

    await orderbook.post(mockOrder);

    expect(orderFilled).toHaveBeenCalledTimes(0);
    expect(orderPartiallyFilled).toHaveBeenCalledTimes(0);
    expect(tradeExecuted).toHaveBeenCalledTimes(0);
    expect(orderPosted).toHaveBeenCalledWith({ order: mockOrder });
    expect(orderbook.peek(sides.BUY)).toEqual({
      price: '1.00000000',
      volume: '100.00000000',
      side: sides.BUY,
    });
  });
  it('should submit a SELL order', async () => {
    const mockOrderUuid = uuid.v1();
    const mockOrder = Order.create({
      id: mockOrderUuid,
      side: sides.SELL,
      price: 1.00,
      volume: 100,
    });
    const orderbook = Orderbook.create();
    const orderFilled = jest.fn();
    const orderPartiallyFilled = jest.fn();
    const orderPosted = jest.fn();
    const tradeExecuted = jest.fn();

    orderbook.on(events.orderFilled, orderFilled);
    orderbook.on(events.orderPartiallyFilled, orderPartiallyFilled);
    orderbook.on(events.orderPosted, orderPosted);
    orderbook.on(events.tradeExecuted, tradeExecuted);

    await orderbook.post(mockOrder);

    expect(orderFilled).toHaveBeenCalledTimes(0);
    expect(orderPartiallyFilled).toHaveBeenCalledTimes(0);
    expect(tradeExecuted).toHaveBeenCalledTimes(0);
    expect(orderPosted).toHaveBeenCalledWith({ order: mockOrder });
    expect(orderbook.peek(sides.SELL)).toEqual({
      price: '1.00000000',
      volume: '100.00000000',
      side: sides.SELL,
    });
  });

  it('should cancel order', async () => {
    const mockOrderUuid = uuid.v1();
    const mockOrder = Order.create({
      id: mockOrderUuid,
      side: sides.BUY,
      price: 1.00,
      volume: 100,
    });
    const orderbook = Orderbook.create();
    const orderFilled = jest.fn();
    const orderPartiallyFilled = jest.fn();
    const orderPosted = jest.fn();
    const orderCancel = jest.fn();
    const tradeExecuted = jest.fn();

    orderbook.on(events.orderFilled, orderFilled);
    orderbook.on(events.orderPartiallyFilled, orderPartiallyFilled);
    orderbook.on(events.orderPosted, orderPosted);
    orderbook.on(events.orderCancel, orderCancel);
    orderbook.on(events.tradeExecuted, tradeExecuted);

    await orderbook.post(mockOrder);
    expect(orderPosted).toHaveBeenCalledWith({ order: mockOrder });
    const x = await orderbook.cancel(mockOrderUuid);
    expect(orderCancel).toHaveBeenCalledWith({ order: mockOrder });
    expect(orderFilled).toHaveBeenCalledTimes(0);
    expect(orderPartiallyFilled).toHaveBeenCalledTimes(0);
    expect(tradeExecuted).toHaveBeenCalledTimes(0);

    expect(orderbook.peek(sides.BUY)).toEqual({
      price: '0.00000000',
      volume: '0.00000000',
      side: sides.BUY,
    });
  });
});
