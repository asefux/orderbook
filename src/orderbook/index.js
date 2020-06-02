const EventEmitter = require('events');
const MemoryLock = require('memory-lock');
const Tree = require('../order-tree');
const Order = require('../order');
const {
  options: { orderbook: defaultOptions },
  enums: { sides, orderbook: { events, actions } },
} = require('../config');

class Orderbook extends EventEmitter {
  constructor(opts) {
    super();

    this.opts = Object.assign(defaultOptions, opts || {});

    this.BUY = Tree.create();
    this.SELL = Tree.create();
    this.orders = {};
    this.locker = new MemoryLock();
  }

  lock() {
    return new Promise((resolve, reject) => {
      this.locker.writeLock(this.opts.maxLockWaitTime, (e) => {
        if (e === 'timeout') return reject();
        return resolve(1);
      });
    });
  }

  release() {
    return new Promise((resolve, reject) => {
      const released = this.locker.writeUnlock();
      if (!released) return reject();
      return resolve(1);
    });
  }

  announce({
    filled, partiallyFilled, trades, orders, cancel,
  }) {
    if (filled) {
      filled.forEach((order) => {
        this.emit(events.orderFilled, { order });
      });
    }
    if (partiallyFilled) {
      partiallyFilled.forEach((order) => {
        this.emit(events.orderPartiallyFilled, { order });
      });
    }

    if (orders) {
      orders.forEach((order) => {
        this.emit(events.orderPosted, { order });
      });
    }

    if (cancel) {
      cancel.forEach((order) => {
        this.emit(events.orderCancel, { order });
      });
    }

    if (trades) {
      trades.forEach((trade) => {
        this.emit(events.tradeExecuted, { trade });
      });
    }
  }

  executeSELL(order) {
    let trades = [];
    let executing = true;
    const filled = [];
    const partiallyFilled = [];
    while (executing) {
      if (!order.hasVolume()) {
        executing = false;
      } else {
        const minOrder = this.SELL.min();
        if (minOrder && minOrder.canClash(order)) {
          const resultingTrades = minOrder.clash(order);
          if (resultingTrades.length > 0) {
            trades = trades.concat(resultingTrades);
          }
          if (!minOrder.hasVolume()) {
            this.SELL.remove(minOrder);
            filled.push(minOrder);
          } else {
            partiallyFilled.push(minOrder);
            executing = false;
          }
        } else {
          executing = false;
        }
      }
    }

    if (!order.hasVolume()) {
      filled.push(order);
    } else if (trades.length > 0) {
      partiallyFilled.push(order);
    }

    return {
      remainingOrder: order,
      filled,
      partiallyFilled,
      trades,
    };
  }

  executeBUY(order) {
    let trades = [];
    let executing = true;
    const filled = [];
    const partiallyFilled = [];
    while (executing) {
      if (!order.hasVolume()) {
        executing = false;
      } else {
        const maxOrder = this.BUY.max();
        if (maxOrder && maxOrder.canClash(order)) {
          const resultingTrades = maxOrder.clash(order);
          if (resultingTrades.length > 0) {
            trades = trades.concat(resultingTrades);
          }
          if (!maxOrder.hasVolume()) {
            this.BUY.remove(maxOrder);
            filled.push(maxOrder);
          } else {
            partiallyFilled.push(maxOrder);
            executing = false;
          }
        } else {
          executing = false;
        }
      }
    }
    if (!order.hasVolume()) {
      filled.push(order);
    } else if (trades.length > 0) {
      partiallyFilled.push(order);
    }
    return {
      remainingOrder: order,
      filled,
      partiallyFilled,
      trades,
    };
  }

  submit_handle_post({ order }) {
    if (order.side === sides.BUY) {
      const {
        remainingOrder, filled, partiallyFilled, trades,
      } = this.executeSELL(order);
      this.announce({
        filled, partiallyFilled, trades,
      });

      if (remainingOrder.hasVolume()) {
        this.BUY.insert(remainingOrder);
        this.orders[remainingOrder.id] = remainingOrder;
        this.announce({ orders: [remainingOrder] });
      }
    } else {
      const {
        remainingOrder, filled, partiallyFilled, trades,
      } = this.executeBUY(order);
      this.announce({
        filled, partiallyFilled, trades,
      });
      if (remainingOrder.hasVolume()) {
        this.SELL.insert(remainingOrder);
        this.announce({ orders: [remainingOrder] });
        this.orders[remainingOrder.id] = remainingOrder;
      }
    }
  }

  submit_handle_cancel({ id }) {
    if (!this.orders[id]) {
      return null;
    }

    const order = this.orders[id];
    const dr = this[order.side].remove(order);

    this.orders[id] = null;
    delete this.orders[id];
    this.announce({ cancel: [order] });
    return dr;
  }

  async submit(action) {
    const { type, data } = action;
    if (typeof (this[`submit_handle_${type}`]) !== 'undefined') {
      await this.lock();
      const r = await this[`submit_handle_${type}`](data);
      await this.release();
      return r;
    }
    return null;
  }

  post(order) {
    return this.submit({
      type: actions.post,
      data: { order },
    });
  }

  cancel(id) {
    return this.submit({
      type: actions.cancel,
      data: { id },
    });
  }

  peek(side, level = 0) {
    if (side === sides.BUY) {
      const order = this.BUY.max();
      if (!order) {
        const nullOrder = Order.createNullOrder(sides.BUY);
        return {
          price: nullOrder.nPrice(),
          volume: nullOrder.nVolume(),
          side: nullOrder.side,
        };
      }
      return {
        price: order.nPrice(),
        volume: order.nVolume(),
        side: order.side,
      };
    } if (side === sides.SELL) {
      const order = this.SELL.min();
      if (!order) {
        const nullOrder = Order.createNullOrder(sides.SELL);
        return {
          price: nullOrder.nPrice(),
          volume: nullOrder.nVolume(),
          side: nullOrder.side,
        };
      }
      return {
        price: order.nPrice(),
        volume: order.nVolume(),
        side: order.side,
      };
    }
    return {
      BUY: this.peek(sides.BUY),
      SELL: this.peek(sides.SELL),
    };
  }

  static create() {
    return new Orderbook();
  }
}

module.exports = Orderbook;
