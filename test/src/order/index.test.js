const { uuid } = require('@asefux/common');

const Order = require('../../../src/order');

const { enums: { sides } } = require('../../../src/config');

describe('Order', () => {
  it('should add volume', () => {
    const aBuyOrder = Order.create({
      id: uuid.v1(), price: 100, volume: 1, side: sides.BUY,
    });

    aBuyOrder.addVolume(10);
    expect(aBuyOrder.nVolume()).toEqual('11.00000000');
  });

  it('should clash two orders', () => {
    const aBuyOrder = Order.create({
      id: uuid.v1(), price: 100, volume: 1, side: sides.BUY,
    });

    const aSellOrder = Order.create({
      id: uuid.v1(), price: 100, volume: 1, side: sides.SELL,
    });

    aBuyOrder.clash(aSellOrder);
    expect(aSellOrder.hasVolume()).toEqual(false);
    expect(aBuyOrder.hasVolume()).toEqual(false);
  });
});
