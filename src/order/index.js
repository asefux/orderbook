const {
  bn, getTimeFromTimeuuid, isUuid, uuid,
} = require('@asefux/common');
const Trade = require('../trade');

const {
  enums: {
    sides: { BUY, SELL },
  },
  options: { order: defaultOptions },
} = require('../config');

class Order {
  constructor({
    price, side, volume, id = uuid.v1(), meta = {}, open = null,
    owner = null,
  }, options) {
    this.price = bn(price);
    this.volume = bn(volume);
    this.side = side.toUpperCase().trim();
    this.owner = owner;
    this.id = id;
    this.meta = meta;
    if (!open) {
      if (isUuid(id, 1)) {
        this.openTime = new Date(getTimeFromTimeuuid(id));
      } else {
        this.openTime = new Date();
      }
    } else {
      this.openTime = new Date(open);
    }

    this.options = Object.assign(defaultOptions, options);
  }

  reference() {
    return this.id;
  }

  sameRef(order) {
    return this.reference() === order.reference();
  }

  nPrice() {
    return this.price.toFixed(this.options.decimals.price);
  }

  nVolume() {
    return this.volume.toFixed(this.options.decimals.volume);
  }

  nCost() {
    return this.volume.multipliedBy(this.price).toFixed(this.options.decimals.price);
  }

  canClash(order) {
    return order.side !== this.side
      && ((order.side === BUY && order.price.isGreaterThanOrEqualTo(this.price))
        || (order.side === SELL && this.price.isGreaterThanOrEqualTo(order.price)));
  }

  clash(order) {
    if (!this.canClash(order)) {
      return null;
    }
    const fills = [];
    const trades = [];

    if (this.side === BUY) {
      if (this.volume.isGreaterThanOrEqualTo(order.volume)) {
        trades.push(Trade.create({
          volume: order.volume,
          price: this.price,
          buy: this.id,
          sell: order.id,
        }));
        this.removeVolume(order.volume);
        order.removeVolume(order.volume);
      } else {
        trades.push(Trade.create({
          volume: this.volume,
          price: this.price,
          buy: this.id,
          sell: order.id,
        }));
        order.removeVolume(this.volume);
        this.removeVolume(this.volume);
      }
    } else if (this.volume.isGreaterThanOrEqualTo(order.volume)) {
      trades.push(Trade.create({
        volume: order.volume,
        price: this.price,
        sell: this.id,
        buy: order.id,
      }));
      this.removeVolume(order.volume);
      order.removeVolume(order.volume);
    } else {
      trades.push(Trade.create({
        volume: this.volume,
        price: this.price,
        sell: this.id,
        buy: order.id,
      }));
      order.removeVolume(this.volume);
      this.removeVolume(this.volume);
    }
    return trades;
  }

  hasVolume() {
    return this.volume.isGreaterThan(0);
  }


  addVolume(volume) {
    this.volume = this.volume.plus(volume);
    return true;
  }

  removeVolume(volume) {
    if (this.volume.isGreaterThanOrEqualTo(volume)) {
      this.volume = this.volume.minus(volume);
      return true;
    }
    return false;
  }

  toJSON() {
    return {
      id: this.id,
      side: this.side,
      price: this.price.toFixed(this.options.decimals.price),
      volume: this.volume.toFixed(this.options.decimals.volume),
      meta: this.meta,
      open: this.openTime.getTime(),
    };
  }

  samePriceWith(order) {
    return this.price.isEqualTo(order);
  }

  // price is greater than
  isHigherThan(order) {
    return this.price.isGreaterThan(order.price);
  }

  isLowerThan(order) {
    return this.price.isLessThan(order.price);
  }

  isLargerThan(order) {
    return this.volume.isGreaterThan(order.volume);
  }

  isSmallerThan(order) {
    return this.volume.isLessThan(order.volume);
  }

  isOlderThan(order) {
    return this.openAt().getTime() < order.openAt().getTime();
  }

  isYoungerThan(order) {
    return this.openAt().getTime() > order.openAt().getTime();
  }

  openAt() {
    return this.openTime;
  }

  compare(b) {
    if (this.sameRef(b)) {
      return 0;
    }


    if (this.isHigherThan(b)) {
      if (this.side === 'BUY') {
        //    return -1;
      }
      return 1;
    }
    if (this.side === 'BUY') {
    //  return 1;
    }
    return -1;
  }

  static compareTwo(a, b) {
    return a.compare(b);
  }

  toString() {
    return `${this.id}|${this.side}|${this.price.toFixed(this.options.decimals.price)}|${this.volume.toFixed(this.options.decimals.volume)}`;
  }

  static create(order) {
    if (!order) {
      return null;
    }
    if (Array.isArray(order)) {
      const [id, side, price, volume, open, meta] = order;
      return new Order({
        id, side, price, volume, open, meta,
      });
    }
    if (typeof (order) === 'string') {
      const [id, side, price, volume, open, meta] = order.split(' ');
      // not yet supported ?
      return null;
    }
    const {
      id, side, price, volume, meta, open,
    } = order;
    return new Order({
      id, side, price, volume, meta, open,
    });
  }

  static createNullOrder(side) {
    if (!side) {
      throw new Error('no side provided for the NULL order');
    }
    return new Order({
      side,
      price: 0,
      volume: 0,
    });
  }
}


module.exports = Order;
