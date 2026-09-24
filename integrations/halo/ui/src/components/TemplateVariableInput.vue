<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'

interface InputContext {
  _value: unknown
  id: string
  disabled?: boolean
  classes: { input?: string }
  node: {
    name: string
    props: { templateKind?: string }
    input: (value: string) => void
  }
  handlers: { blur: (event: FocusEvent) => void }
}

const props = defineProps<{ context: InputContext }>()

const variableDetails = computed(() => props.context.node.props.templateKind === 'site'
  ? [
      { name: 'sitePv', description: '网站累计浏览量' },
      { name: 'siteUv', description: '网站累计访客数' },
      { name: 'sitePvToday', description: '网站今日浏览量' },
      { name: 'siteUvToday', description: '网站今日访客数' },
    ]
  : [
      { name: 'pagePv', description: '当前文章累计浏览量' },
      { name: 'pageUv', description: '当前文章累计访客数' },
      { name: 'pagePvToday', description: '当前文章今日浏览量' },
      { name: 'pageUvToday', description: '当前文章今日访客数' },
    ])
const variables = computed(() => variableDetails.value.map((item) => item.name))
const variableSet = computed(() => new Set(variables.value))
const draft = ref('')
const caret = ref(0)
const focused = ref(false)
const dismissed = ref(false)
const selectedIndex = ref(0)
const editorElement = ref<HTMLElement | null>(null)
const inputElement = ref<HTMLInputElement | null>(null)
const highlightElement = ref<HTMLElement | null>(null)
const caretMarkerElement = ref<HTMLElement | null>(null)
const suggestionElement = ref<HTMLElement | null>(null)
const suggestionLeft = ref(0)
let resizeObserver: ResizeObserver | undefined
const listId = computed(() => `${props.context.id}-suggestions`)

watch(() => props.context._value, (value) => {
  const nextValue = String(value ?? '')
  if (draft.value !== nextValue) draft.value = nextValue
}, { immediate: true })

const segments = computed(() => {
  const result: Array<{ text: string; variable: boolean }> = []
  const pattern = /\{[A-Za-z]+}/g
  let previousEnd = 0
  for (const match of draft.value.matchAll(pattern)) {
    const start = match.index
    if (start > previousEnd) result.push({ text: draft.value.slice(previousEnd, start), variable: false })
    result.push({ text: match[0], variable: variableSet.value.has(match[0].slice(1, -1)) })
    previousEnd = start + match[0].length
  }
  if (previousEnd < draft.value.length) result.push({ text: draft.value.slice(previousEnd), variable: false })
  return result
})
const caretSegments = computed(() => {
  const before: typeof segments.value = []
  const after: typeof segments.value = []
  let remaining = caret.value
  for (const segment of segments.value) {
    if (remaining >= segment.text.length) {
      before.push(segment)
      remaining -= segment.text.length
    } else if (remaining <= 0) {
      after.push(segment)
    } else {
      before.push({ ...segment, text: segment.text.slice(0, remaining) })
      after.push({ ...segment, text: segment.text.slice(remaining) })
      remaining = 0
    }
  }
  return { before, after }
})

const token = computed(() => {
  const beforeCaret = draft.value.slice(0, caret.value)
  const match = beforeCaret.match(/\{([A-Za-z]*)$/)
  return match ? { start: caret.value - match[0].length, prefix: match[1] } : null
})
const suggestions = computed(() => token.value
  ? variables.value.filter((name) => name.toLowerCase().startsWith(token.value!.prefix.toLowerCase()))
  : [])
const showSuggestions = computed(() => focused.value && !dismissed.value && suggestions.value.length > 0)

function updateCaret() {
  caret.value = inputElement.value?.selectionStart ?? 0
}

function syncScroll() {
  if (inputElement.value && highlightElement.value) {
    highlightElement.value.scrollLeft = inputElement.value.scrollLeft
  }
}

function updateSuggestionPosition() {
  if (!editorElement.value || !caretMarkerElement.value || !suggestionElement.value) return
  const editorRect = editorElement.value.getBoundingClientRect()
  const caretRect = caretMarkerElement.value.getBoundingClientRect()
  const rightmostLeft = Math.max(0, editorElement.value.clientWidth - suggestionElement.value.offsetWidth)
  suggestionLeft.value = Math.max(0, Math.min(caretRect.left - editorRect.left, rightmostLeft))
}

watch([draft, caret, showSuggestions], async () => {
  await nextTick()
  syncScroll()
  updateSuggestionPosition()
}, { flush: 'post' })

onMounted(() => {
  if (!editorElement.value) return
  resizeObserver = new ResizeObserver(updateSuggestionPosition)
  resizeObserver.observe(editorElement.value)
})
onBeforeUnmount(() => resizeObserver?.disconnect())

function onInput(event: Event) {
  const input = event.target as HTMLInputElement
  draft.value = input.value
  caret.value = input.selectionStart ?? input.value.length
  dismissed.value = false
  selectedIndex.value = 0
  props.context.node.input(input.value)
  syncScroll()
}

function complete(name: string) {
  if (!token.value) return
  const before = draft.value.slice(0, token.value.start)
  const after = draft.value.slice(caret.value)
  // 光标在已有变量中间时，替换完整变量；普通后续文字不受影响。
  const existingTail = after.match(/^[A-Za-z]*}/)?.[0] ?? ''
  const replacement = `{${name}}`
  const value = before + replacement + after.slice(existingTail.length)
  const nextCaret = before.length + replacement.length
  draft.value = value
  props.context.node.input(value)
  dismissed.value = true
  void nextTick(() => {
    inputElement.value?.focus()
    inputElement.value?.setSelectionRange(nextCaret, nextCaret)
    caret.value = nextCaret
    syncScroll()
  })
}

function onKeydown(event: KeyboardEvent) {
  if (event.isComposing) return
  if (!showSuggestions.value) return
  if (event.key === 'ArrowDown') {
    event.preventDefault()
    selectedIndex.value = (selectedIndex.value + 1) % suggestions.value.length
  } else if (event.key === 'ArrowUp') {
    event.preventDefault()
    selectedIndex.value = (selectedIndex.value - 1 + suggestions.value.length) % suggestions.value.length
  } else if (event.key === 'Enter' || event.key === 'Tab') {
    event.preventDefault()
    complete(suggestions.value[selectedIndex.value]!)
  } else if (event.key === 'Escape') {
    event.preventDefault()
    dismissed.value = true
  }
}

function onBlur(event: FocusEvent) {
  focused.value = false
  props.context.handlers.blur(event)
}
</script>

<template>
  <div class="template-field">
    <div ref="editorElement" class="template-editor">
      <div ref="highlightElement" class="template-highlight" aria-hidden="true">
        <span v-for="(segment, index) in caretSegments.before" :key="`before-${index}`"
          :class="{ 'template-variable': segment.variable }">{{ segment.text }}</span>
        <span ref="caretMarkerElement" class="caret-marker" />
        <span v-for="(segment, index) in caretSegments.after" :key="`after-${index}`"
          :class="{ 'template-variable': segment.variable }">{{ segment.text }}</span>
      </div>
      <input ref="inputElement" :id="context.id" :name="context.node.name" :value="draft"
        :class="context.classes.input" class="template-input" type="text" autocomplete="off" spellcheck="false"
        :disabled="context.disabled" role="combobox" aria-autocomplete="list" :aria-expanded="showSuggestions"
        :aria-controls="showSuggestions ? listId : undefined" :aria-describedby="`${context.id}-variable-help`"
        :aria-activedescendant="showSuggestions ? `${listId}-${selectedIndex}` : undefined"
        @input="onInput" @scroll="syncScroll(); updateSuggestionPosition()" @focus="focused = true; updateCaret()"
        @click="updateCaret" @keyup="updateCaret" @keydown="onKeydown" @blur="onBlur">
      <div v-if="showSuggestions" :id="listId" ref="suggestionElement" class="template-suggestions"
        :style="{ left: `${suggestionLeft}px` }" role="listbox" aria-label="可用变量">
        <button v-for="(name, index) in suggestions" :id="`${listId}-${index}`" :key="name" type="button"
          role="option" :aria-selected="index === selectedIndex" :class="{ 'is-selected': index === selectedIndex }"
          @pointerdown.prevent="complete(name)">
          <span class="suggestion-variable">{{ '{' + name + '}' }}</span>
        </button>
      </div>
    </div>
    <div :id="`${context.id}-variable-help`" class="template-help">
      <div class="template-help-title">可用的变量：</div>
      <div v-for="item in variableDetails" :key="item.name" class="template-help-row">
        <span class="template-variable help-variable">{{ '{' + item.name + '}' }}</span>
        <span>{{ item.description }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.template-field {
  width: min(100%, 32rem);
  min-width: 0;
}
.template-editor {
  position: relative;
  width: 100%;
  background: #fff;
}
.template-input,
.template-highlight {
  box-sizing: border-box;
  width: 100%;
  height: 2.5rem;
  border: 1px solid transparent;
  border-radius: .375rem;
  padding: .5rem .75rem;
  font: inherit;
  font-size: .875rem;
  line-height: 1.5rem;
  letter-spacing: inherit;
  white-space: pre;
}
.template-input {
  position: relative;
  z-index: 1;
  border-color: #d1d5db;
  background: transparent;
  color: transparent;
  -webkit-text-fill-color: transparent;
  caret-color: #374151;
}
.template-input:focus {
  border-color: rgb(var(--colors-primary) / 1);
  outline: 2px solid rgb(var(--colors-primary) / .15);
  outline-offset: 0;
}
.template-input:disabled { cursor: not-allowed; opacity: .55; }
.template-input::placeholder { color: #9ca3af; -webkit-text-fill-color: #9ca3af; }
.template-highlight {
  position: absolute;
  z-index: 0;
  inset: 0;
  overflow: hidden;
  color: #374151;
  pointer-events: none;
}
.caret-marker { display: inline-block; width: 0; height: 1px; }
.template-variable {
  border-radius: .2rem;
  color: #1d4ed8;
  background: #eff6ff;
}
.template-help {
  display: grid;
  gap: .125rem;
  margin-top: .5rem;
  color: #6b7280;
  font-size: .75rem;
  line-height: 1.5;
}
.template-help-title { margin-bottom: .125rem; }
.template-help-row { display: flex; flex-wrap: wrap; align-items: baseline; gap: .375rem; }
.help-variable { padding: 0 .125rem; white-space: nowrap; }
.template-suggestions {
  position: absolute;
  z-index: 20;
  top: calc(100% + .25rem);
  width: min(14rem, 100%);
  overflow: hidden;
  border: 1px solid #e5e7eb;
  border-radius: .5rem;
  background: #fff;
  box-shadow: 0 8px 24px rgb(0 0 0 / .12);
}
.template-suggestions button {
  display: block;
  width: 100%;
  border: 0;
  padding: .5rem .75rem;
  color: #374151;
  background: transparent;
  text-align: left;
  cursor: pointer;
}
.template-suggestions button:hover,
.template-suggestions button.is-selected { background: #f3f4f6; }
.suggestion-variable { color: #1d4ed8; font-weight: 500; }
</style>
