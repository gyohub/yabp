# Vue 3 State Management with Pinia

## Golden Rules 🌟
1.  **Modular Stores**: Pinia stores should be modular by domain (e.g., `useAuthStore`, `useCartStore`).
2.  **Setup Stores**: Prefer "Setup Stores" (function syntax) over "Option Stores" (object syntax) for better alignment with Composition API.
3.  **Direct Access**: State can be read and mutated directly (`store.counter++`), but prefer actions for complex logic.
4.  **No Mutation**: Unlike Vuex, mutations are gone. Just update state variable in actions.
5.  **Destructuring**: To destructure state/getters and keep reactivity, use `storeToRefs(store)`.

## Technology-Specific Best Practices
-   **Persistence**: Use `pinia-plugin-persistedstate` to save store to LocalStorage/SessionStorage effortlessly.
-   **DevTools**: Pinia has first-class integration with Vue DevTools.
-   **HMR**: Hot Module Replacement works out of the box.

## Complete Code Example

```ts
// stores/cart.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

interface Product {
  id: number
  title: string
  price: number
}

export const useCartStore = defineStore('cart', () => {
  // State
  const items = ref<Product[]>([])

  // Getters
  const totalItems = computed(() => items.value.length)
  const totalPrice = computed(() => {
    return items.value.reduce((acc, item) => acc + item.price, 0)
  })

  // Actions
  function addItem(product: Product) {
    items.value.push(product)
  }

  function removeItem(id: number) {
    const index = items.value.findIndex(i => i.id === id)
    if (index > -1) items.value.splice(index, 1)
  }

  function clearCart() {
    items.value = []
  }

  return { items, totalItems, totalPrice, addItem, removeItem, clearCart }
}, {
    persist: true // using plugin
})
```

```vue
<!-- components/CartWidget.vue -->
<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useCartStore } from '@/stores/cart'

const cartStore = useCartStore()

// Good: Destructuring reactivity
const { totalItems, totalPrice } = storeToRefs(cartStore)
// Actions don't need storeToRefs
const { clearCart } = cartStore
</script>

<template>
  <div class="cart">
    <span>Items: {{ totalItems }}</span>
    <span>Total: ${{ totalPrice }}</span>
    <button @click="clearCart">Clear</button>
  </div>
</template>
```

## Security Considerations
-   **Sensitivity**: Do not store sensitive session tokens directly in store if persisting to LocalStorage without encryption.
-   **SSR**: When using SSR (Nuxt), ensure state is serialized correctly to prevent XSS (Pinia handles this automatically generally).
