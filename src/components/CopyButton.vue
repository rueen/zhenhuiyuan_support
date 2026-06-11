<script setup>
import { message } from 'ant-design-vue'

const props = defineProps({
  /** 要复制的文本内容 */
  text: { type: String, required: true },
  /** 按钮显示文字 */
  label: { type: String, default: '复制' },
})

function fallbackCopy() {
  const el = document.createElement('textarea')
  el.value = props.text
  el.style.cssText = 'position:fixed;opacity:0;pointer-events:none'
  document.body.appendChild(el)
  el.focus()
  el.select()
  try {
    document.execCommand('copy')
    message.success('已复制')
  } catch {
    message.error('复制失败，请手动复制')
  } finally {
    document.body.removeChild(el)
  }
}

/**
 * 将文本写入剪贴板，优先使用 Clipboard API，降级使用 execCommand
 */
function handleCopy() {
  if (navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(props.text)
      .then(() => message.success('已复制'))
      .catch(() => fallbackCopy())
  } else {
    fallbackCopy()
  }
}
</script>

<template>
  <a-button type="link" size="small" style="padding:0" @click="handleCopy">{{ label }}</a-button>
</template>
