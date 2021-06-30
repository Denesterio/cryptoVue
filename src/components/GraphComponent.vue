<template>
  <section v-if="name" class="relative">
    <h3 class="text-lg leading-6 font-medium text-gray-900 my-8">
      {{ name }} - USD
    </h3>
    <div
      ref="graph"
      class="flex items-end border-gray-600 border-b border-l h-64"
    >
      <div
        v-for="(bar, i) in normalizedGraph"
        :key="i"
        :style="{ height: `${bar}%`, width: `${this.graphBarWidth}px` }"
        class="bg-purple-800 border"
      ></div>
    </div>
    <button
      @click="deselectTicker"
      type="button"
      class="absolute top-0 right-0"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        xmlns:xlink="http://www.w3.org/1999/xlink"
        xmlns:svgjs="http://svgjs.com/svgjs"
        version="1.1"
        width="30"
        height="30"
        x="0"
        y="0"
        viewBox="0 0 511.76 511.76"
        style="enable-background: new 0 0 512 512"
        xml:space="preserve"
      >
        <g>
          <path
            d="M436.896,74.869c-99.84-99.819-262.208-99.819-362.048,0c-99.797,99.819-99.797,262.229,0,362.048    c49.92,49.899,115.477,74.837,181.035,74.837s131.093-24.939,181.013-74.837C536.715,337.099,536.715,174.688,436.896,74.869z     M361.461,331.317c8.341,8.341,8.341,21.824,0,30.165c-4.16,4.16-9.621,6.251-15.083,6.251c-5.461,0-10.923-2.091-15.083-6.251    l-75.413-75.435l-75.392,75.413c-4.181,4.16-9.643,6.251-15.083,6.251c-5.461,0-10.923-2.091-15.083-6.251    c-8.341-8.341-8.341-21.845,0-30.165l75.392-75.413l-75.413-75.413c-8.341-8.341-8.341-21.845,0-30.165    c8.32-8.341,21.824-8.341,30.165,0l75.413,75.413l75.413-75.413c8.341-8.341,21.824-8.341,30.165,0    c8.341,8.32,8.341,21.824,0,30.165l-75.413,75.413L361.461,331.317z"
            fill="#718096"
            data-original="#000000"
          ></path>
        </g>
      </svg>
    </button>
  </section>
</template>

<script>
export default {
  props: {
    name: {
      type: String,
      required: false,
      default: "",
    },
    price: {
      type: Number,
      required: false,
      default: 0,
    },
  },

  emits: {
    "deselect-ticker": (value) => value === null,
  },

  mounted() {
    window.addEventListener("resize", this.changeGraphElementWidth);
  },

  beforeUnmount() {
    window.removeEventListener("resize", this.changeGraphElementWidth);
  },

  data() {
    return {
      graph: [],
      graphBarWidth: 28,
      maxGraphLength: 1,
    };
  },

  computed: {
    normalizedGraph() {
      const max = Math.max(...this.graph);
      const min = Math.min(...this.graph);

      if (max === min) {
        return this.graph.map(() => 50);
      }

      return this.graph.map((price) => 5 + ((price - min) * 95) / (max - min));
    },
  },

  methods: {
    calculateMaxGraphLength() {
      if (!this.$refs.graph) return;
      this.maxGraphLength = this.$refs.graph.clientWidth / this.graphBarWidth;
    },

    normalizeGraphElementWidth() {
      if (this.graph.length > this.maxGraphLength) {
        this.graph = this.graph.slice(this.graph.length - this.maxGraphLength);
      }
    },

    changeGraphElementWidth() {
      this.calculateMaxGraphLength();
      this.normalizeGraphElementWidth();
    },

    deselectTicker() {
      this.$emit("deselect-ticker", null);
    },
  },

  watch: {
    name(value) {
      this.graph = [];
      if (value) {
        this.$nextTick().then(this.calculateMaxGraphLength);
      }
    },

    price() {
      this.graph.push(this.price);
      this.normalizeGraphElementWidth();
    },
  },
};
</script>
