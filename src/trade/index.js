const { uuid, bn } = require('@asefux/common');

const { options: { trade: defaultOptions } } = require('../config');

class Trade {
  constructor({
    id = uuid.v1(),
    volume, price, cost,
    buy, sell,
    meta = {},
  }, options) {
    this.id = id;
    this.volume = bn(volume);
    if (price) {
      this.price = bn(price);
      this.cost = this.price.multipliedBy(this.volume);
    } else if (cost) {
      this.cost = bn(cost);
      this.price = this.cost.dividedBy(this.volume);
    }
    this.buy = buy;
    this.sell = sell;
    this.meta = meta;
    this.options = Object.assign(defaultOptions, options);
  }

  toJSON() {
    return {
      id: this.id,
      volume: this.volume.toFixed(this.options.decimals.volume),
      price: this.price.toFixed(this.options.decimals.price),
      cost: this.cost.toFixed(this.options.decimals.price),
      buy: this.buy,
      sell: this.sell,
      meta: this.meta,
    };
  }

  toString() {
    return `${this.id}|${this.price.toFixed(this.options.decimals.price)}|${this.volume.toFixed(this.options.decimals.volume)}|${this.cost.toFixed(this.options.decimals.price)}|${this.buy},${this.sell}`;
  }

  static create(trade) {
    const {
      id, volume, price, cost, buy, sell, meta,
    } = trade;
    return new Trade({
      id, volume, price, cost, buy, sell, meta,
    });
  }
}


module.exports = Trade;
