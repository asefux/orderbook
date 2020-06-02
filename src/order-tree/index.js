const Order = require('../order');

const helpers = {};
helpers.first = function (array) {
  return array && array.length ? array[0] : undefined;
};

helpers.last = function (array) {
  return array && array.length ? array[array.length - 1] : undefined;
};

const defaultOptions = {
  comparator: Order.compareTwo,
};

class Tree {
  constructor(value, options) {
    this.opts = {
      ...defaultOptions,
      ...(options || {}),
    };
    this.initialize();
    if (value) {
      this.value = value;
    }
    this.height = 1;
  }

  initialize() {
    this.value = undefined;
    this.left = undefined;
    this.right = undefined;
    this.height = 0;
    return this;
  }

  comparator() {
    return (this.opts.comparator || defaultOptions.comparator);
  }

  compare() {

  }

  insert(value) {
    if (!this.value) {
      this.value = value;

      return this.value;
    }
    const comparator = this.comparator();
    const comparison = comparator(this.value, value);
    let inserted = false;
    if (comparison > 0) {
      this.insertLeft(value);
      inserted = true;
    } else if (comparison < 0) {
      this.insertRight(value);
      inserted = true;
    } else {
      return false;
    }

    if (inserted) {
      this.updateHeight();
      this.balance();
    }

    return inserted;
  }

  find(value) {
    const comparison = this.comparator()(this.value, value);
    if (comparison === 0) return this;
    if (comparison > 0) return this.left ? this.left.find(value) : undefined;
    return this.right ? this.right.find(value) : undefined;
  }

  remove(value) {
    const parents = this.findNodeWithParents(value);

    const node = parents.pop();

    if (!node) return false;

    const parent = helpers.last(parents);

    const rebalanceParents = () => {
      this.rebalanceNodes(parents.slice(0).reverse());
    };
    const updateParentRef = (newValue) => {
      if (parent.left && parent.left.value.sameRef(node.value)) {
        parent.left = newValue;
      } else if (parent.right && parent.right.value.sameRef(node.value)) {
        parent.right = newValue;
      } else {
        return false;
      }

      rebalanceParents.bind(this)();
      return true;
    };

    if (!node.left && !node.right) {
      if (!parent) {
        return node.initialize();
      }
      return updateParentRef.bind(this)(undefined);
    } if (node.left ? !node.right : node.right) {
      if (!parent) {
        const replacement = node.left || node.right;
        node.value = replacement.value;
        node.left = replacement.left;
        node.right = replacement.right;
        return true;
      }
      return updateParentRef.bind(this)(node.left || node.right);
    }
    const replaceParents = [node].concat(node.left ? node.left.maxWithParents() : node.right.minWithParents());
    const replace = replaceParents.pop();
    const replaceParent = helpers.last(replaceParents);
    node.value = replace.value;
    if (node.left) {
      replaceParent.right = replace.left;
    } else {
      replaceParent.left = replace.right;
    }
    node.rebalanceNodes(replaceParents.slice(1));
    rebalanceParents.bind(this)();

    return true;
  }

  rebalanceNodes(nodes) {
    nodes.forEach((node) => {
      node.update();
    });
  }

  maxWithParents() {
    return this.right ? [this].concat(this.right.maxWithParents()) : [this];
  }

  minWithParents() {
    return this.left ? [this].concat(this.left.minWithParents()) : [this];
  }

  findNodeWithParents(value) {
    const comparison = this.comparator()(this.value, value);
    const thisValue = [this];
    if (comparison === 0) return thisValue;
    if (comparison > 0) return this.left ? thisValue.concat(this.left.findNodeWithParents(value)) : thisValue;
    return this.right ? thisValue.concat(this.right.findNodeWithParents(value)) : thisValue;
  }

  hasChild() {
    return !!(this.left || this.right);
  }

  min() {
    return this.left ? this.left.min() : this.value;
  }

  max() {
    return this.right ? this.right.max() : this.value;
  }

  insertChild(position, value) {
    if (!this[position]) {
      this[position] = Tree.create(value, this.opts);
      return this[position];
    }
    return this[position].insert(value);
  }

  insertLeft(value) {
    this.insertChild('left', value);
  }

  insertRight(value) {
    this.insertChild('right', value);
  }

  updateHeight() {
    const leftHeight = this.left ? this.left.height : 0;
    const rightHeight = this.right ? this.right.height : 0;
    this.height = !this.left && !this.right
      ? 1
      : (Math.max(leftHeight, rightHeight) + 1);
  }

  updateValue(updateValueFn, args) {
    updateValueFn.bind(this)(...args);
  }

  balance() {
    const balanceFactor = this.getBalanceFactor();
    if (balanceFactor === 2) {
      if (this.left.getBalanceFactor() === -1) {
        this.left.rotateLeft();
      }
      this.rotateRight();
    }
    if (balanceFactor === -2) {
      if (this.right.getBalanceFactor() === 1) {
        this.right.rotateRight();
      }
      this.rotateLeft();
    }
  }

  rotateLeft() {
    this.rotate('right', 'left');
  }

  rotateRight() {
    this.rotate('left', 'right');
  }

  rotate(from, to) {
    const { value } = this;
    const fromNode = this[from];
    const toNode = this[to];
    const fromToNode = this[from][to];

    this.value = fromNode.value;
    fromNode.value = value;

    this[to] = fromNode;
    this[from] = fromNode[from];
    this[to][to] = toNode;
    this[to][from] = fromToNode;
    if (this.left) this.left.updateHeight();
    if (this.right) this.right.updateHeight();
    this.updateHeight();
  }

  getBalanceFactor() {
    return Tree.getHeightOfNode(this.left) - Tree.getHeightOfNode(this.right);
  }

  update() {
    this.updateHeight();
    this.balance();
  }

  walk(reversed = false) {
    let values = [];
    if (!reversed) {
      if (this.left) {
        values = values.concat(this.left.walk(reversed));
      }
      values.push(this.value);
      if (this.right) {
        values = values.concat(this.right.walk(reversed));
      }
      return values;
    }
    if (this.right) {
      values = values.concat(this.right.walk(reversed));
    }
    values.push(this.value);
    if (this.left) {
      values = values.concat(this.left.walk(reversed));
    }
    return values;
  }


  toString() {
    return `{"reference": "${this.value ? this.value.reference() : 'null'}", "price": ${this.value ? this.value.nPrice() : 'null'}, "height": ${this.height}, "balance": ${this.getBalanceFactor()},\n"left": ${this.left || 'null'},\n"right": ${this.right || 'null'}}`;
  }

  static getHeightOfNode(node) {
    return node ? node.height : 0;
  }

  static create(value, opts) {
    return new Tree(value, opts);
  }
}


module.exports = Tree;
