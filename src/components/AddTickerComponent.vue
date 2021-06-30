<template>
  <section>
    <div class="flex">
      <div class="max-w-xs">
        <label for="wallet" class="block text-sm font-medium text-gray-700"
          >Тикер</label
        >
        <div class="mt-1 relative rounded-md shadow-md">
          <input
            v-model="ticker"
            @keyup.enter="add"
            type="text"
            name="wallet"
            id="wallet"
            class="
              block
              w-full
              pr-10
              border-gray-300
              text-gray-900
              focus:outline-none focus:ring-gray-500 focus:border-gray-500
              sm:text-sm
              rounded-md
            "
            placeholder="Например, DOGE"
            required
          />
        </div>
        <template v-if="filteredTooltips.length > 0">
          <div
            @click="addTooltipToInput($event)"
            class="flex bg-white shadow-md p-1 rounded-md shadow-md flex-wrap"
          >
            <span
              v-for="(ttip, index) of filteredTooltips"
              :key="index"
              class="
                inline-flex
                items-center
                px-2
                m-1
                rounded-md
                text-xs
                font-medium
                bg-gray-300
                text-gray-800
                cursor-pointer
              "
            >
              {{ ttip }}
            </span>
          </div>
        </template>
        <div v-if="isNotValid" class="text-sm text-red-400 p-2">
          Такой тикер уже добавлен
        </div>
      </div>
    </div>
    <add-button-component @click="add" :disabled="disabled" />
  </section>
</template>

<script>
import AddButtonComponent from "./AddButtonComponent";

export default {
  components: {
    AddButtonComponent,
  },

  props: {
    disabled: {
      type: Boolean,
      required: false,
      default: false,
    },
    isNotValid: {
      type: Boolean,
      required: false,
      default: false,
    },
  },

  emits: {
    "add-ticker": (value) => typeof value === "string",
    "clear-validation": (value) => typeof value === "string",
  },

  data() {
    return {
      ticker: "",
      currencies: [],
    };
  },

  created() {
    const url = new URL(
      "https://min-api.cryptocompare.com/data/all/coinlist?summary=true"
    );
    fetch(url)
      .then((response) => response.json())
      .then((data) => {
        this.currencies = Object.values(data.Data)
          .map((v) => v.Symbol)
          .reduce((acc, current) => {
            if (!acc[current[0]]) {
              acc[current[0]] = [];
            }
            acc[current[0]].push(current);
            return acc;
          }, {});
        for (const value in this.currencies) {
          this.currencies[value].sort((a, b) => a.length - b.length);
        }
      });
  },

  computed: {
    filteredTooltips() {
      const tickerStart = this.ticker.toUpperCase();
      return tickerStart[0]
        ? this.currencies[tickerStart[0]]
            .filter((cur) => cur.startsWith(tickerStart))
            .slice(0, 4)
            .filter((cur) => cur !== undefined)
        : [];
    },
  },

  methods: {
    add() {
      if (this.ticker.length === 0) return;
      this.$emit("add-ticker", this.ticker);
      this.clearInput();
    },

    clearInput() {
      if (!this.error) {
        this.ticker = "";
      }
    },

    addTooltipToInput(event) {
      this.ticker = event.target.textContent;
      this.add();
    },
  },

  watch: {
    ticker() {
      if (this.ticker.length > 0) {
        this.$emit("clear-validation", "");
      }
    },
  },
};
</script>
