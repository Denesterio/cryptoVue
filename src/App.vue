<template>
  <div class="container mx-auto flex flex-col items-center bg-gray-100 p-4">
    <!-- <div
      class="
        fixed
        w-100
        h-100
        opacity-80
        bg-purple-800
        inset-0
        z-50
        flex
        items-center
        justify-center
      "
    >
      <svg
        class="animate-spin -ml-1 mr-3 h-12 w-12 text-white"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          class="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          stroke-width="4"
        ></circle>
        <path
          class="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        ></path>
      </svg>
    </div> -->
    <div class="container">
      <add-ticker-component
        @add-ticker="add"
        @clear-validation="clearValidation"
        :disabled="tooManyTickers"
        :isNotValid="isTickerNotValid"
      />
      <template v-if="tickers.length > 0">
        <hr class="w-full border-t border-gray-600 my-4" />
        <button
          v-if="page > 1"
          @click="page = page - 1"
          class="
            my-4
            inline-flex
            items-center
            mx-2
            py-2
            px-4
            border border-transparent
            shadow-sm
            text-sm
            leading-4
            font-medium
            rounded-full
            text-white
            bg-gray-600
            hover:bg-gray-700
            transition-colors
            duration-300
            focus:outline-none
            focus:ring-2
            focus:ring-offset-2
            focus:ring-gray-500
          "
        >
          Назад
        </button>
        <button
          v-if="hasNextPage"
          @click="page = page + 1"
          class="
            my-4
            inline-flex
            items-center
            mx-2
            py-2
            px-4
            border border-transparent
            shadow-sm
            text-sm
            leading-4
            font-medium
            rounded-full
            text-white
            bg-gray-600
            hover:bg-gray-700
            transition-colors
            duration-300
            focus:outline-none
            focus:ring-2
            focus:ring-offset-2
            focus:ring-gray-500
          "
        >
          Вперед
        </button>
        <p>Фильтр: <input v-model="filter" type="text" class="ml-2" /></p>
        <hr class="w-full border-t border-gray-600 my-4" />
        <dl class="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-3">
          <div
            v-for="t of paginatedTickers"
            :key="t.name"
            @click="select(t)"
            :class="{
              'border-4': selectedTicker === t,
              'bg-white': t.valid,
            }"
            class="
              overflow-hidden
              shadow
              rounded-lg
              border-purple-800 border-solid
              cursor-pointer
            "
          >
            <div
              class="px-4 py-5 sm:p-6 text-center"
              :class="{ 'bg-red-100': t.valid === false }"
            >
              <dt class="text-sm font-medium text-gray-500 truncate">
                {{ t.name }} - USD
              </dt>
              <dd class="mt-1 text-3xl font-semibold text-gray-900">
                {{ formatPrice(t.price) }}
              </dd>
            </div>
            <div class="w-full border-t border-gray-200"></div>
            <button
              @click.stop="handleDelete(t)"
              class="
                flex
                items-center
                justify-center
                font-medium
                w-full
                bg-gray-100
                px-4
                py-4
                sm:px-6
                text-md text-gray-500
                hover:text-gray-600 hover:bg-gray-200 hover:opacity-20
                transition-all
                focus:outline-none
              "
            >
              <svg
                class="h-5 w-5"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="#718096"
                aria-hidden="true"
              >
                <path
                  fill-rule="evenodd"
                  d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                  clip-rule="evenodd"
                ></path></svg
              >Удалить
            </button>
          </div>
        </dl>
        <hr class="w-full border-t border-gray-600 my-4" />
      </template>
      <graph-component
        v-bind="selectedTicker"
        @deselect-ticker="deselectTicker"
      />
    </div>
  </div>
</template>

<script>
import { subscribeToTicker, unsubscribeFromTicker } from "./api.js";
import AddTickerComponent from "./components/AddTickerComponent.vue";
import GraphComponent from "./components/GraphComponent.vue";

export default {
  name: "App",

  components: {
    AddTickerComponent,
    GraphComponent,
  },

  data() {
    return {
      filter: "",

      tickers: [],
      selectedTicker: null,

      isTickerNotValid: false,
      maxTickersQuantity: 18,

      page: 1,
    };
  },

  created() {
    const windowData = Object.fromEntries(
      new URL(window.location).searchParams.entries()
    );
    if (windowData.filter) this.filter = windowData.filter;
    if (windowData.page) this.page = windowData.page;
  },

  beforeMount() {
    const tickersData = localStorage.getItem("cryptovue-list");
    if (tickersData) {
      this.tickers = JSON.parse(tickersData);
      this.tickers.forEach((ticker) => {
        subscribeToTicker(ticker.name, (newPrice) => {
          this.updateTicker(ticker.name, newPrice);
        });
      });
    }
  },

  computed: {
    startIndex() {
      return (this.page - 1) * 6;
    },

    endIndex() {
      return this.page * 6;
    },

    filteredTickers() {
      return this.tickers.filter((ticker) =>
        ticker.name.includes(this.filter.toUpperCase())
      );
    },

    paginatedTickers() {
      return this.filteredTickers.slice(this.startIndex, this.endIndex);
    },

    hasNextPage() {
      return this.filteredTickers.length > this.endIndex;
    },

    pageStateOptions() {
      return {
        filter: this.filter,
        page: this.page,
      };
    },

    tooManyTickers() {
      return this.tickers.length === this.maxTickersQuantity;
    },
  },

  methods: {
    updateTicker(tickerName, price) {
      const currentTicker = this.tickers.find(
        (ticker) => ticker.name == tickerName
      );
      currentTicker.price = price;
      if (price === "-") {
        currentTicker.valid = false;
        return;
      }
    },

    formatPrice(price) {
      if (typeof price === "number") {
        return price > 1 ? price.toFixed(2) : price.toPrecision(2);
      }
      return price;
    },

    add(ticker) {
      const currentTicker = {
        name: ticker.toUpperCase(),
        price: "-",
        valid: true,
      };

      this.validateTicker(currentTicker);
      if (this.isTickerNotValid) {
        return;
      }

      this.tickers = [...this.tickers, currentTicker];

      this.filter = "";
      subscribeToTicker(currentTicker.name, (newPrice) => {
        this.updateTicker(currentTicker.name, newPrice);
      });
    },

    validateTicker(ticker) {
      this.isTickerNotValid = !!this.tickers.find(
        (t) => t.name === ticker.name
      );
    },

    handleDelete(tickerToRemove) {
      this.tickers = this.tickers.filter((tick) => tick !== tickerToRemove);
      localStorage.setItem("cryptovue-list", JSON.stringify(this.tickers));
      if (this.selectedTicker === tickerToRemove) {
        this.selectedTicker = null;
      }
      unsubscribeFromTicker(tickerToRemove.name);
    },

    select(ticker) {
      this.selectedTicker = ticker;
    },

    deselectTicker() {
      this.selectedTicker = null;
    },

    clearValidation() {
      this.isTickerNotValid = false;
    },
  },

  watch: {
    tickers() {
      localStorage.setItem("cryptovue-list", JSON.stringify(this.tickers));
    },

    filter() {
      this.page = 1;
    },

    pageStateOptions(value) {
      const { pathname } = window.location;
      window.history.pushState(
        null,
        document.title,
        `${pathname}?filter=${value.filter}&page=${value.page}`
      );
    },

    paginatedTickers() {
      if (this.paginatedTickers.length === 0 && this.page > 1) {
        this.page -= 1;
      }
    },
  },
};
</script>
