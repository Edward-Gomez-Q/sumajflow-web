<script setup>
import { ref, computed } from 'vue'
import { Upload, File, X, Loader2, AlertCircle } from 'lucide-vue-next'

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  label: {
    type: String,
    required: true
  },
  helperText: {
    type: String,
    default: ''
  },
  accept: {
    type: String,
    default: 'image/*,.pdf'
  },
  maxSize: {
    type: Number,
    default: 5 // MB
  },
  required: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue'])

const fileInput = ref(null)
const fileName = ref('')
const fileSize = ref(0)
const uploading = ref(false)
const error = ref('')

const hasFile = computed(() => props.modelValue !== '')

const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}

const handleFileSelect = () => {
  fileInput.value?.click()
}

const handleFileChange = async (event) => {
  const file = event.target.files?.[0]
  if (!file) return

  error.value = ''

  // Validar tamaño
  if (file.size > props.maxSize * 1024 * 1024) {
    error.value = `El archivo excede el tamaño máximo de ${props.maxSize}MB`
    return
  }

  fileName.value = file.name
  fileSize.value = file.size
  uploading.value = true

  try {
    // TODO: Aquí iría la lógica para subir el archivo a tu servidor/S3
    // Por ahora, simulamos la subida y convertimos a base64 o URL temporal
    
    // Opción 1: Convertir a base64 (para archivos pequeños)
    const reader = new FileReader()
    reader.onload = (e) => {
      emit('update:modelValue', e.target.result)
      uploading.value = false
    }
    reader.onerror = () => {
      error.value = 'Error al leer el archivo'
      uploading.value = false
    }
    reader.readAsDataURL(file)

    // Opción 2: Subir a servidor (implementar cuando tengas el endpoint)
    /*
    const formData = new FormData()
    formData.append('file', file)
    
    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData
    })
    
    const data = await response.json()
    emit('update:modelValue', data.url)
    uploading.value = false
    */
  } catch (err) {
    error.value = 'Error al subir el archivo'
    uploading.value = false
  }
}

const removeFile = () => {
  emit('update:modelValue', '')
  fileName.value = ''
  fileSize.value = 0
  error.value = ''
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}
</script>

<template>
  <div class="input-group">
    <label class="input-label">
      {{ label }}
      <span v-if="required" class="text-error">*</span>
    </label>

    <input
      ref="fileInput"
      type="file"
      :accept="accept"
      @change="handleFileChange"
      class="hidden"
    />

    <!-- Empty state - Upload area -->
    <div v-if="!hasFile" class="space-y-2">
      <button
        type="button"
        @click="handleFileSelect"
        :disabled="uploading"
        class="w-full border-2 border-dashed border-border hover:border-primary rounded-lg p-6 transition-all duration-200"
        :class="{ 
          'opacity-50 cursor-not-allowed': uploading,
          'hover:bg-primary/5': !uploading
        }"
      >
        <div class="flex flex-col items-center gap-3">
          <div class="w-12 h-12 rounded-full bg-primary/10 center">
            <Loader2 v-if="uploading" class="w-6 h-6 text-primary animate-spin" />
            <Upload v-else class="w-6 h-6 text-primary" />
          </div>
          <div class="text-center">
            <p class="text-sm font-medium text-neutral">
              {{ uploading ? 'Subiendo archivo...' : 'Haz clic para seleccionar archivo' }}
            </p>
            <p class="text-xs text-tertiary mt-1">
              Máximo {{ maxSize }}MB • {{ accept.includes('image') ? 'Imágenes' : '' }}{{ accept.includes('pdf') ? ' y PDF' : '' }}
            </p>
          </div>
        </div>
      </button>
    </div>

    <!-- File uploaded state -->
    <div v-else class="border border-border rounded-lg p-4 bg-surface">
      <div class="flex items-center justify-between gap-3">
        <div class="flex items-center gap-3 flex-1 min-w-0">
          <div class="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 center flex-shrink-0">
            <File class="w-5 h-5 text-green-600 dark:text-green-400" />
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-neutral truncate">{{ fileName }}</p>
            <p class="text-xs text-tertiary">{{ formatFileSize(fileSize) }}</p>
          </div>
        </div>
        <button
          type="button"
          @click="removeFile"
          class="w-8 h-8 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 center text-red-600 dark:text-red-400 transition-colors flex-shrink-0"
          title="Eliminar archivo"
        >
          <X class="w-5 h-5" />
        </button>
      </div>
    </div>

    <!-- Helper text -->
    <p v-if="helperText && !error" class="input-helper">
      {{ helperText }}
    </p>

    <!-- Error message -->
    <div v-if="error" class="flex items-start gap-2 mt-2">
      <AlertCircle class="w-4 h-4 text-error flex-shrink-0 mt-0.5" />
      <p class="text-xs text-error">{{ error }}</p>
    </div>
  </div>
</template>