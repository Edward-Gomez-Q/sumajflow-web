// src/directives/clickOutside.js
export const clickOutside = {
  mounted(el, binding) {
    setTimeout(() => {
      el.clickOutsideEvent = (event) => {
        if (!(el === event.target || el.contains(event.target))) {
          binding.value(event)
        }
      }
      document.addEventListener('click', el.clickOutsideEvent)
    }, 100)
  },
  unmounted(el) {
    if (el.clickOutsideEvent) {
      document.removeEventListener('click', el.clickOutsideEvent)
    }
  }
}