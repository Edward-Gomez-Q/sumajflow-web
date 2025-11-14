<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { Upload, File, X, Loader2, AlertCircle, CheckCircle2, Eye, Image as ImageIcon, FileText } from 'lucide-vue-next'
import rutaApi from '../../assets/rutaApi.js'

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
    default: 10 // MB
  },
  required: {
    type: Boolean,
    default: false
  },
  folder: {
    type: String,
    default: 'general'
  }
})

const emit = defineEmits(['update:modelValue'])

const API_URL = rutaApi

const fileInput = ref(null)
const fileName = ref('')
const fileSize = ref(0)
const fileType = ref('')
const uploading = ref(false)
const uploadProgress = ref(0)
const error = ref('')
const previewUrl = ref('')
const isImage = ref(false)
const isPdf = ref(false)

const hasFile = computed(() => props.modelValue !== '')

// Función para obtener información del archivo desde MinIO
const loadFileInfo = async (objectName) => {
  if (!objectName) return
  
  try {
    // Obtener la URL del archivo
    const urlResponse = await fetch(`${API_URL}/files/url?objectName=${encodeURIComponent(objectName)}`)
    const urlData = await urlResponse.json()
    
    if (urlData.success) {
      previewUrl.value = urlData.url
      
      // Determinar tipo de archivo por extensión
      const ext = objectName.split('.').pop()?.toLowerCase()
      isImage.value = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)
      isPdf.value = ext === 'pdf'
      
      // Extraer nombre de archivo
      const parts = objectName.split('/')
      fileName.value = decodeURIComponent(parts[parts.length - 1])
      
      fileType.value = isImage.value ? 'image' : (isPdf.value ? 'application/pdf' : 'unknown')
    }
  } catch (err) {
    console.error('Error al cargar información del archivo:', err)
  }
}

// Cargar información cuando cambia el modelValue
watch(() => props.modelValue, async (newValue) => {
  if (newValue && !uploading.value) {
    await loadFileInfo(newValue)
  } else if (!newValue) {
    // Limpiar cuando no hay archivo
    fileName.value = ''
    fileSize.value = 0
    fileType.value = ''
    previewUrl.value = ''
    isImage.value = false
    isPdf.value = false
  }
}, { immediate: true })

onMounted(async () => {
  if (props.modelValue) {
    await loadFileInfo(props.modelValue)
  }
})

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
  uploadProgress.value = 0

  // Validar tipo de archivo
  const validImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
  const validTypes = [...validImageTypes, 'application/pdf']
  
  if (!validTypes.includes(file.type)) {
    error.value = 'Solo se permiten imágenes (JPEG, PNG, GIF, WEBP) y archivos PDF'
    return
  }

  // Validar tamaño
  if (file.size > props.maxSize * 1024 * 1024) {
    error.value = `El archivo excede el tamaño máximo de ${props.maxSize}MB`
    return
  }

  fileName.value = file.name
  fileSize.value = file.size
  fileType.value = file.type
  uploading.value = true

  try {
    // Crear FormData
    const formData = new FormData()
    formData.append('file', file)
    formData.append('folder', props.folder)

    // Simular progreso
    const progressInterval = setInterval(() => {
      if (uploadProgress.value < 90) {
        uploadProgress.value += 10
      }
    }, 100)

    // Subir archivo al backend
    const response = await fetch(`${API_URL}/files/upload`, {
      method: 'POST',
      body: formData
    })

    clearInterval(progressInterval)
    uploadProgress.value = 100

    const data = await response.json()

    if (!response.ok || !data.success) {
      throw new Error(data.message || 'Error al subir el archivo')
    }

    // Emitir el objectName para que se guarde en el modelo
    emit('update:modelValue', data.data.objectName)
    
    // Cargar información del archivo subido
    await loadFileInfo(data.data.objectName)
    
  } catch (err) {
    error.value = err.message || 'Error al subir el archivo'
    fileName.value = ''
    fileSize.value = 0
    fileType.value = ''
    uploadProgress.value = 0
  } finally {
    uploading.value = false
  }
}

const removeFile = async () => {
  if (!confirm('¿Estás seguro de que deseas eliminar este archivo?')) {
    return
  }

  try {
    // Si hay un archivo subido en MinIO, eliminarlo
    if (props.modelValue) {
      const response = await fetch(`${API_URL}/files?objectName=${encodeURIComponent(props.modelValue)}`, {
        method: 'DELETE'
      })
      
      const data = await response.json()
      
      if (!data.success) {
        console.warn('No se pudo eliminar el archivo del servidor:', data.message)
      }
    }
  } catch (err) {
    console.error('Error al eliminar archivo:', err)
  }

  // Limpiar estado local
  emit('update:modelValue', '')
  fileName.value = ''
  fileSize.value = 0
  fileType.value = ''
  error.value = ''
  previewUrl.value = ''
  uploadProgress.value = 0
  isImage.value = false
  isPdf.value = false
  
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

// Función para previsualizar el archivo en nueva pestaña
const previewFile = () => {
  if (previewUrl.value) {
    window.open(previewUrl.value, '_blank')
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
      :required="required && !hasFile"
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
              Máximo {{ maxSize }}MB • {{ accept.includes('image') ? 'Imágenes' : '' }}{{ accept.includes('pdf') ? (accept.includes('image') ? ' y PDF' : 'PDF') : '' }}
            </p>
          </div>
          
          <!-- Progress bar -->
          <div v-if="uploading" class="w-full max-w-xs">
            <div class="h-1 bg-border rounded-full overflow-hidden">
              <div 
                class="h-full bg-primary transition-all duration-300"
                :style="{ width: uploadProgress + '%' }"
              ></div>
            </div>
            <p class="text-xs text-center text-secondary mt-2">{{ uploadProgress }}%</p>
          </div>
        </div>
      </button>
    </div>

    <!-- File uploaded state -->
    <div v-else class="border border-green-400/60 bg-green-100/70 dark:border-green-700 dark:bg-green-900/40 rounded-lg overflow-hidden shadow-sm backdrop-blur-[2px]">
      
      <!-- Preview para imágenes -->
      <div v-if="isImage && previewUrl" class="relative bg-gray-100 dark:bg-gray-800">
        <img 
          :src="previewUrl" 
          :alt="fileName"
          class="w-full h-48 object-cover"
          @error="isImage = false"
        />
        <div class="absolute top-2 right-2 flex gap-2">
          <button
            type="button"
            @click="previewFile"
            class="w-8 h-8 rounded-lg bg-white/90 dark:bg-gray-800/90 hover:bg-white dark:hover:bg-gray-800 center shadow-lg transition-all"
            title="Ver en tamaño completo"
          >
            <Eye class="w-4 h-4 text-gray-700 dark:text-gray-300" />
          </button>
          <button
            type="button"
            @click="removeFile"
            class="w-8 h-8 rounded-lg bg-red-500/90 hover:bg-red-500 center text-white shadow-lg transition-all"
            title="Eliminar archivo"
          >
            <X class="w-4 h-4" />
          </button>
        </div>
      </div>

      <!-- Info del archivo -->
      <div class="p-4">
        <div class="flex items-center justify-between gap-3">
          <div class="flex items-center gap-3 flex-1 min-w-0">
            <div class="w-10 h-10 rounded-lg bg-green-200/50 dark:bg-green-800/50 center flex-shrink-0">
              <ImageIcon v-if="isImage" class="w-5 h-5 text-green-700 dark:text-green-300" />
              <FileText v-else-if="isPdf" class="w-5 h-5 text-green-700 dark:text-green-300" />
              <CheckCircle2 v-else class="w-5 h-5 text-green-700 dark:text-green-300" />
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-neutral truncate">{{ fileName || 'Archivo cargado' }}</p>
              <p class="text-xs text-secondary">
                {{ fileSize ? formatFileSize(fileSize) : (isPdf ? 'Documento PDF' : (isImage ? 'Imagen' : 'Archivo')) }}
              </p>
            </div>
          </div>
          <div class="flex items-center gap-2 flex-shrink-0">
            <button
              v-if="!isImage"
              type="button"
              @click="previewFile"
              class="w-8 h-8 rounded-lg hover:bg-green-200 dark:hover:bg-green-800/50 center text-green-700 dark:text-green-300 transition-colors"
              title="Abrir en nueva pestaña"
            >
              <Eye class="w-4 h-4" />
            </button>
            <button
              type="button"
              @click="removeFile"
              class="w-8 h-8 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 center text-red-600 dark:text-red-400 transition-colors"
              title="Eliminar archivo"
            >
              <X class="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Helper text -->
    <p v-if="helperText && !error" class="input-helper">
      {{ helperText }}
    </p>

    <!-- Error message -->
    <div v-if="error" class="bg-error/10 border border-error/30 rounded-lg p-3 mt-2">
      <div class="flex items-start gap-2">
        <AlertCircle class="w-4 h-4 text-error flex-shrink-0 mt-0.5" />
        <p class="text-xs text-error">{{ error }}</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.center {
  @apply flex justify-center items-center;
}
</style>