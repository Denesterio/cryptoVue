const API_KEY =
  "8edefebe143c8e0ed44ba2f28ed3e44d00e69c313e309964babea234cda2213d";

const tickersHandlers = new Map();
const invalidTickersHandlers = new Map();
const invalidTickersPrices = {};
const socket = new WebSocket(
  `wss://streamer.cryptocompare.com/v2?api_key=${API_KEY}`
);
const MARKET = "CCCAGG";
const AGG_INDEX = "5";
const INVALID_MESSAGE = "INVALID_SUB";
const CURRENCY = "USD";
const INT_CURRENCY = "BTC";

const updateInvalidTickers = (newPrice) => {
  invalidTickersHandlers.forEach((handlers, ticker) => {
    handlers.forEach((handler) =>
      handler(newPrice * invalidTickersPrices[ticker])
    );
  });
};

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
    const currencyTo = splitted[splitted.length - 1];
    const handlers = tickersHandlers.get(tickerName);
    if (currencyTo === INT_CURRENCY) {
      handlers.forEach((fn) => fn("-"));
      invalidTickersHandlers.delete(tickerName);
    } else if (currencyTo === CURRENCY) {
      invalidTickersHandlers.set(tickerName, handlers);
      subscribeByWebSocket(tickerName, INT_CURRENCY);
      if (
        tickersHandlers.has(INT_CURRENCY) &&
        tickersHandlers
          .get(INT_CURRENCY)
          .find((handler) => handler.name === "updateInvalidTickers")
      )
        return;
      subscribeToTicker(INT_CURRENCY, updateInvalidTickers);
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
  const subscribers = tickersHandlers.get(ticker);
  // если мы удаляем BTC, но его курс еще нужен для апдейта других валют,
  // то оставляем обработчик этого апдейта
  if (ticker === INT_CURRENCY && subscribers.length > 1) {
    const updater = subscribers.filter(
      (handler) => handler.name === "updateInvalidTickers"
    );
    tickersHandlers.set(ticker, updater);
    return;
  }
  // если удаляем BTC с одним обработчиком или другую валюту
  // с проверкой есть ли она в невалидных и удалением оттуда
  tickersHandlers.delete(ticker);
  unsubscribeByWebSocket(ticker, CURRENCY);
  if (invalidTickersHandlers.has(ticker)) {
    invalidTickersHandlers.delete(ticker);
    unsubscribeByWebSocket(ticker, INT_CURRENCY);
    delete invalidTickersPrices[ticker];
    // остается вариант, при котором мы удаляем невалидную валюту,
    // и у BTC либо только обработчик невалидных валют, либо 2 обработчика
    const btcSubscribers = tickersHandlers.get(INT_CURRENCY);
    if (invalidTickersHandlers.size === 0 && btcSubscribers.length > 1) {
      const filteredBtcSubscribers = btcSubscribers.filter(
        (subsc) => subsc.name !== "updateInvalidTickers"
      );
      tickersHandlers.set(INT_CURRENCY, filteredBtcSubscribers);
    } else {
      tickersHandlers.delete(INT_CURRENCY);
      unsubscribeByWebSocket(INT_CURRENCY, CURRENCY);
    }
  }
};
