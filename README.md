# Orderbook

`npm install --save @asefux/orderbook

```javascript


module.exports = {
  Orderbook,
  Order,
  Trade,
  OrderTree,
  enums,
};


```

## enums

### enums.sides
- BUY
- SELL

### enums.orderbook.events
events emitted by the orderbook

- orderFilled
- orderPartiallyFilled
- orderPosted
- orderCancel
- tradeExecuted

## example

```javascript

const { Orderbook, Order, enums: { sides, orderbook: {events} } } = require('@asefux/orderbook');

const orderbook = Orderbook.create();

orderbook.on(events.orderPosted, ({ order })=> console.log(`order posted ${order}`))

const order = Order.create({
      side: sides.BUY,
      price: 1.00,
      volume: 100,
});

orderbook.post(order).then(()=>{
        // do something after submission has been processed by orderbook.

        // log the best prices, with coresponding volumes on both BUY and SELL sides of the orderbook
        console.log(orderbook.peek());
        
        setTimeout(()=>{
        // cancel the order after 1 second
        orderbook.cancel(order.id);
}, 1000);
});

```

## Orderbook
event emitter
### .post(anOrder) , returns Promise
### .cancel(anOrder.id) , returns Promise
### .peek(side = undefined) , returns object
`.peed()` output
```javascript
{ BUY: { price, volume, side }, SELL: { price, volume, side } }
```

`.peek(sides.BUY)`
```javascript
{ price, volume, side }
```


# changes

<table>
<thead>
<tr>
<th>Version</th><th>Description</th>
</tr>
</thead>
<tbody>
<tr>
<td>1.0.1</td><td> <ul><li>exports `enums`</li><li>readme update</li></ul> </td>
</tr>
<tr>
<td>1.0.2</td><td> readme & license update </td>
</tr>

</tbody>
</table>
