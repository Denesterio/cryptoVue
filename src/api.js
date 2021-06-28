const API_KEY =
  "8edefebe143c8e0ed44ba2f28ed3e44d00e69c313e309964babea234cda2213d";

const tickersHandlers = new Map();
const invalidTickersPrices = {};
const socket = new WebSocket(
  `wss://streamer.cryptocompare.com/v2?api_key=${API_KEY}`
);
const MARKET = "CCCAGG";
const AGG_INDEX = "5";
const INVALID_MESSAGE = "INVALID_SUB";
const CURRENCY = "USD";
const INT_CURRENCY = "BTC";
// let BTC_USD = "";

const subscribeByWebSocket = (ticker, currency) => {
  const preparedMessage = {
    action: "SubAdd",
    subs: [[AGG_INDEX, MARKET, ticker, currency].join("~")],
  };
  if (socket.readyState === 1) {
    socket.send(JSON.stringify(preparedMessage));
    return;
  }
  socket.addEventListener(
    "open",
    () => socket.send(JSON.stringify(preparedMessage)),
    { once: true }
  );
};

const unsubscribeByWebSocket = (ticker, currency) => {
  const preparedMessage = {
    action: "SubRemove",
    subs: [[AGG_INDEX, MARKET, ticker, currency].join("~")],
  };
  socket.send(JSON.stringify(preparedMessage));
};

socket.addEventListener("message", (event) => {
  const {
    TYPE: type,
    MESSAGE: message,
    FROMSYMBOL: currencyFrom,
    TOSYMBOL: currencyTo,
    PRICE: newPrice,
    PARAMETER: parameter,
  } = JSON.parse(event.data);

  if (message === INVALID_MESSAGE) {
    const splitted = parameter.split("~");
    const tickerName = splitted[splitted.length - 2];
    const curTo = splitted[splitted.length - 1];
    if (curTo === INT_CURRENCY) {
      const handlers = tickersHandlers.get(tickerName);
      handlers.forEach((fn) => fn("-"));
      const handlersBTC = tickersHandlers.get(INT_CURRENCY);
      const index = handlersBTC.indexOf(
        handlersBTC.find((func) => func.tickerName === tickerName)
      );
      handlersBTC.splice(index, 1);
      unsubscribeByWebSocket(tickerName, CURRENCY);
      unsubscribeByWebSocket(tickerName, INT_CURRENCY);
    } else if (curTo === CURRENCY) {
      const handlersBTC = tickersHandlers.get(INT_CURRENCY) || [];
      const callback = (newPrice) => {
        const subs = tickersHandlers.get(tickerName);
        const finalPrice = newPrice * invalidTickersPrices[tickerName];
        subs.forEach((func) => func(finalPrice));
      };

      tickersHandlers.set(INT_CURRENCY, [...handlersBTC, callback]);
      subscribeByWebSocket(tickerName, INT_CURRENCY);
    }
  }

  if (currencyTo === INT_CURRENCY) {
    invalidTickersPrices[currencyFrom] = newPrice;
    return;
  }

  if (type !== AGG_INDEX || newPrice === undefined) return;

  const handlers = tickersHandlers.get(currencyFrom) ?? [];
  handlers.forEach((fn) => fn(newPrice));
});

export const subscribeToTicker = (ticker, cb) => {
  const subscribers = tickersHandlers.get(ticker) || [];
  tickersHandlers.set(ticker, [...subscribers, cb]);
  subscribeByWebSocket(ticker, CURRENCY);
};

export const unsubscribeFromTicker = (ticker) => {
  tickersHandlers.delete(ticker);
  unsubscribeByWebSocket(ticker, CURRENCY);
};
