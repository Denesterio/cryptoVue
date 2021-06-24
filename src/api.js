const API_KEY =
  "8edefebe143c8e0ed44ba2f28ed3e44d00e69c313e309964babea234cda2213d";

const tickersHandlers = new Map();
const socket = new WebSocket(
  `wss://streamer.cryptocompare.com/v2?api_key=${API_KEY}`
);
const MARKET = "CCCAGG";
const AGG_INDEX = "5";
const CURRENCY = "USD";

const subscribeByWebSocket = (ticker) => {
  const preparedMessage = {
    action: "SubAdd",
    subs: [[AGG_INDEX, MARKET, ticker, CURRENCY].join("~")],
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

const unsubscribeByWebSocket = (ticker) => {
  const preparedMessage = {
    action: "SubRemove",
    subs: [[AGG_INDEX, MARKET, ticker, CURRENCY].join("~")],
  };
  socket.send(JSON.stringify(preparedMessage));
};

socket.addEventListener("message", (event) => {
  const {
    TYPE: type,
    FROMSYMBOL: currencyFrom,
    PRICE: newPrice,
  } = JSON.parse(event.data);
  if (type !== AGG_INDEX || newPrice === undefined) return;

  const handlers = tickersHandlers.get(currencyFrom) ?? [];
  handlers.forEach((fn) => fn(newPrice));
});

export const subscribeToTicker = (ticker, cb) => {
  const subscribers = tickersHandlers.get(ticker) || [];
  tickersHandlers.set(ticker, [...subscribers, cb]);
  subscribeByWebSocket(ticker);
};

export const unsubscribeFromTicker = (ticker) => {
  tickersHandlers.delete(ticker);
  unsubscribeByWebSocket(ticker);
};
