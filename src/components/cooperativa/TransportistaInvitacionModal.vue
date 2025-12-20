<!-- src/components/cooperativa/TransportistaInvitacionModal.vue -->
<script setup>
import { ref, computed } from 'vue'
import { useTransportistaStore } from '@/stores/cooperativa/transportistaStore'
import {
  X,
  User,
  Phone,
  AlertTriangle,
  CheckCircle2,
  Download,
  Share2,
  Loader2,
  QrCode,
  Copy
} from 'lucide-vue-next'

const emit = defineEmits(['close', 'invitacion-creada'])

const transportistaStore = useTransportistaStore()

// State
const form = ref({
  primerNombre: '',
  segundoNombre: '',
  primerApellido: '',
  segundoApellido: '',
  numeroCelular: ''
})

const validationErrors = ref({
  primerNombre: '',
  segundoNombre: '',
  primerApellido: '',
  segundoApellido: '',
  numeroCelular: ''
})

const isProcessing = ref(false)
const invitacionCreada = ref(null)
const qrCopiado = ref(false)

// Computed
const isFormValid = computed(() => {
  return form.value.primerNombre.trim() !== '' &&
         form.value.segundoNombre.trim() !== '' &&
         form.value.primerApellido.trim() !== '' &&
         form.value.segundoApellido.trim() !== '' &&
         form.value.numeroCelular.trim() !== '' &&
         !validationErrors.value.primerNombre &&
         !validationErrors.value.segundoNombre &&
         !validationErrors.value.primerApellido &&
         !validationErrors.value.segundoApellido &&
         !validationErrors.value.numeroCelular
})

const nombreCompleto = computed(() => {
  const partes = [
    form.value.primerNombre,
    form.value.segundoNombre,
    form.value.primerApellido,
    form.value.segundoApellido
  ].filter(p => p && p.trim() !== '')
  
  return partes.join(' ')
})

// Methods
const validatePrimerNombre = () => {
  if (!form.value.primerNombre.trim()) {
    validationErrors.value.primerNombre = 'El primer nombre es requerido'
    return false
  }
  validationErrors.value.primerNombre = ''
  return true
}

const validateSegundoNombre = () => {
  if (!form.value.segundoNombre.trim()) {
    validationErrors.value.segundoNombre = 'El segundo nombre es requerido'
    return false
  }
  validationErrors.value.segundoNombre = ''
  return true
}

const validatePrimerApellido = () => {
  if (!form.value.primerApellido.trim()) {
    validationErrors.value.primerApellido = 'El primer apellido es requerido'
    return false
  }
  validationErrors.value.primerApellido = ''
  return true
}

const validateSegundoApellido = () => {
  if (!form.value.segundoApellido.trim()) {
    validationErrors.value.segundoApellido = 'El segundo apellido es requerido'
    return false
  }
  validationErrors.value.segundoApellido = ''
  return true
}

const validateCelular = () => {
  const celular = form.value.numeroCelular.trim()
  
  if (!celular) {
    validationErrors.value.numeroCelular = 'El número de celular es requerido'
    return false
  }

  // Validar formato: solo 8 dígitos que empiecen con 6 o 7
  const regex = /^[67]\d{7}$/
  if (!regex.test(celular)) {
    validationErrors.value.numeroCelular = 'Debe ser 8 dígitos: 7XXXXXXX o 6XXXXXXX'
    return false
  }

  validationErrors.value.numeroCelular = ''
  return true
}

const formatearCelular = () => {
  // Solo permitir números
  let celular = form.value.numeroCelular.replace(/\D/g, '')
  
  // Limitar a 8 dígitos
  if (celular.length > 8) {
    celular = celular.slice(0, 8)
  }

  form.value.numeroCelular = celular
}

const agregarCodigoPais = (celular) => {
  // Agregar +591 al número limpio
  return '+591' + celular.trim()
}

const crearInvitacion = async () => {
  // Validar todo
  const primerNombreValid = validatePrimerNombre()
  const segundoNombreValid = validateSegundoNombre()
  const primerApellidoValid = validatePrimerApellido()
  const segundoApellidoValid = validateSegundoApellido()
  const celularValid = validateCelular()

  if (!primerNombreValid || !segundoNombreValid || !primerApellidoValid || !segundoApellidoValid || !celularValid) {
    return
  }

  isProcessing.value = true

  try {
    // Agregar +591 al número antes de enviar
    const celularConCodigo = agregarCodigoPais(form.value.numeroCelular)

    const result = await transportistaStore.crearInvitacion({
      primerNombre: form.value.primerNombre.trim(),
      segundoNombre: form.value.segundoNombre.trim(),
      primerApellido: form.value.primerApellido.trim(),
      segundoApellido: form.value.segundoApellido.trim(),
      numeroCelular: celularConCodigo
    })

    if (result.success) {
      invitacionCreada.value = result.data
    } else {
      // Mostrar error
      if (result.error.includes('invitación activa')) {
        validationErrors.value.numeroCelular = result.error
      } else if (result.error.includes('24 horas')) {
        validationErrors.value.numeroCelular = result.error
      } else {
        validationErrors.value.primerNombre = result.error
      }
    }
  } catch (error) {
    console.error('Error al crear invitación:', error)
  } finally {
    isProcessing.value = false
  }
}

const descargarQR = () => {
  if (!invitacionCreada.value || !invitacionCreada.value.qrCodeBase64) return

  const link = document.createElement('a')
  link.href = invitacionCreada.value.qrCodeBase64
  link.download = `QR-${nombreCompleto.value.replace(/ /g, '-')}.png`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

const compartirQR = async () => {
  if (!invitacionCreada.value || !invitacionCreada.value.qrCodeBase64) return

  try {
    // Convertir base64 a blob
    const response = await fetch(invitacionCreada.value.qrCodeBase64)
    const blob = await response.blob()
    const file = new File([blob], `QR-${nombreCompleto.value}.png`, { type: 'image/png' })

    if (navigator.share && navigator.canShare({ files: [file] })) {
      await navigator.share({
        title: 'Invitación de Transportista',
        text: `Invitación para ${nombreCompleto.value}`,
        files: [file]
      })
    } else {
      // Fallback: copiar imagen al portapapeles
      await copiarQRAlPortapapeles(blob)
    }
  } catch (error) {
    console.error('Error al compartir:', error)
    // Fallback
    descargarQR()
  }
}

const copiarQRAlPortapapeles = async (blob) => {
  try {
    if (navigator.clipboard && window.ClipboardItem) {
      await navigator.clipboard.write([
        new ClipboardItem({
          'image/png': blob
        })
      ])
      
      qrCopiado.value = true
      setTimeout(() => {
        qrCopiado.value = false
      }, 2000)
    } else {
      // Si no se puede copiar al portapapeles, descargar
      descargarQR()
    }
  } catch (error) {
    console.error('Error al copiar:', error)
    descargarQR()
  }
}

const cerrarYNotificar = () => {
  emit('invitacion-creada')
}
</script>

<template>
  <Teleport to="body">
    <div
      class="fixed inset-0 z-10000 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      @click.self="emit('close')"
    >
      <div class="bg-surface rounded-xl shadow-2xl w-full max-w-2xl border border-border max-h-[90vh] overflow-y-auto">
        
        <!-- Header -->
        <div class="flex items-center justify-between p-6 border-b border-border sticky top-0 bg-surface z-10">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-lg bg-primary/10 center">
              <QrCode class="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 class="text-xl font-semibold text-neutral">Crear Invitación</h3>
              <p class="text-sm text-secondary mt-0.5">Genera un QR para el transportista</p>
            </div>
          </div>
          <button
            @click="emit('close')"
            class="w-10 h-10 rounded-lg hover:bg-hover center transition-colors"
          >
            <X class="w-5 h-5 text-tertiary" />
          </button>
        </div>

        <!-- Contenido -->
        <div class="p-6">
          
          <!-- Formulario -->
          <div v-if="!invitacionCreada" class="space-y-5">
            
            <!-- Nombres -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <!-- Primer Nombre -->
              <div class="input-group">
                <label for="primer-nombre" class="input-label">
                  Primer Nombre <span class="text-error">*</span>
                </label>
                <div class="relative">
                  <User class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-tertiary" />
                  <input
                    id="primer-nombre"
                    v-model="form.primerNombre"
                    @blur="validatePrimerNombre"
                    @input="validationErrors.primerNombre = ''"
                    type="text"
                    placeholder="Juan"
                    class="w-full pl-10"
                    :class="{ 'border-error': validationErrors.primerNombre }"
                  />
                </div>
                <p
                  v-if="validationErrors.primerNombre"
                  class="text-error text-xs mt-1 flex items-center gap-1"
                >
                  <AlertTriangle class="w-3 h-3" />
                  {{ validationErrors.primerNombre }}
                </p>
              </div>

              <!-- Segundo Nombre -->
              <div class="input-group">
                <label for="segundo-nombre" class="input-label">
                  Segundo Nombre <span class="text-error">*</span>
                </label>
                <input
                  id="segundo-nombre"
                  v-model="form.segundoNombre"
                  @blur="validateSegundoNombre"
                  @input="validationErrors.segundoNombre = ''"
                  type="text"
                  placeholder="Carlos"
                  class="w-full"
                  :class="{ 'border-error': validationErrors.segundoNombre }"
                />
                <p
                  v-if="validationErrors.segundoNombre"
                  class="text-error text-xs mt-1 flex items-center gap-1"
                >
                  <AlertTriangle class="w-3 h-3" />
                  {{ validationErrors.segundoNombre }}
                </p>
              </div>
            </div>

            <!-- Apellidos -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <!-- Primer Apellido -->
              <div class="input-group">
                <label for="primer-apellido" class="input-label">
                  Primer Apellido <span class="text-error">*</span>
                </label>
                <input
                  id="primer-apellido"
                  v-model="form.primerApellido"
                  @blur="validatePrimerApellido"
                  @input="validationErrors.primerApellido = ''"
                  type="text"
                  placeholder="Pérez"
                  class="w-full"
                  :class="{ 'border-error': validationErrors.primerApellido }"
                />
                <p
                  v-if="validationErrors.primerApellido"
                  class="text-error text-xs mt-1 flex items-center gap-1"
                >
                  <AlertTriangle class="w-3 h-3" />
                  {{ validationErrors.primerApellido }}
                </p>
              </div>

              <!-- Segundo Apellido -->
              <div class="input-group">
                <label for="segundo-apellido" class="input-label">
                  Segundo Apellido <span class="text-error">*</span>
                </label>
                <input
                  id="segundo-apellido"
                  v-model="form.segundoApellido"
                  @blur="validateSegundoApellido"
                  @input="validationErrors.segundoApellido = ''"
                  type="text"
                  placeholder="García"
                  class="w-full"
                  :class="{ 'border-error': validationErrors.segundoApellido }"
                />
                <p
                  v-if="validationErrors.segundoApellido"
                  class="text-error text-xs mt-1 flex items-center gap-1"
                >
                  <AlertTriangle class="w-3 h-3" />
                  {{ validationErrors.segundoApellido }}
                </p>
              </div>
            </div>

            <!-- Preview del nombre completo -->
            <div v-if="nombreCompleto" class="bg-hover rounded-lg p-3">
              <p class="text-xs text-secondary mb-1">Nombre completo:</p>
              <p class="text-sm font-medium text-neutral">{{ nombreCompleto }}</p>
            </div>

            <!-- Número de Celular -->
            <div class="input-group">
              <label for="numero-celular" class="input-label">
                Número de Celular <span class="text-error">*</span>
              </label>
              <div class="relative">
                <div class="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  <Phone class="w-5 h-5 text-tertiary" />
                  <span class="text-sm text-secondary font-medium">+591</span>
                </div>
                <input
                  id="numero-celular"
                  v-model="form.numeroCelular"
                  @input="formatearCelular(); validationErrors.numeroCelular = ''"
                  @blur="validateCelular()"
                  type="tel"
                  placeholder="70123456"
                  maxlength="8"
                  class="w-full pl-20"
                  :class="{ 'border-error': validationErrors.numeroCelular }"
                />
              </div>
              <p
                v-if="validationErrors.numeroCelular"
                class="text-error text-xs mt-1 flex items-center gap-1"
              >
                <AlertTriangle class="w-3 h-3" />
                {{ validationErrors.numeroCelular }}
              </p>
              <p v-else class="input-helper">
                Solo números, sin espacios: 7XXXXXXX o 6XXXXXXX
              </p>
            </div>

            <!-- Nota informativa -->
            <div class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div class="flex gap-3">
                <QrCode class="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                <div>
                  <h4 class="text-sm font-semibold text-neutral mb-1">
                    ¿Cómo funciona?
                  </h4>
                  <ul class="text-xs text-secondary space-y-1">
                    <li>1. Completa todos los datos del transportista (nombres y apellidos completos)</li>
                    <li>2. Ingresa solo el número de celular (8 dígitos), el +591 se agrega automáticamente</li>
                    <li>3. Se generará un código QR único para este transportista</li>
                    <li>4. Comparte el QR por WhatsApp, email o imprímelo</li>
                    <li>5. El transportista escanea el QR desde la app móvil</li>
                    <li>6. Recibirá un código de verificación por WhatsApp</li>
                    <li>7. Podrá completar su registro en la app</li>
                    <li>8. El QR expira en 7 días</li>
                  </ul>
                </div>
              </div>
            </div>

          </div>

          <!-- Resultado exitoso con QR -->
          <div v-else class="space-y-5">
            
            <!-- Icono de éxito -->
            <div class="text-center">
              <div class="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 center mx-auto mb-4">
                <CheckCircle2 class="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <h4 class="text-lg font-semibold text-neutral mb-2">
                ¡Código QR Generado!
              </h4>
              <p class="text-sm text-secondary">
                Comparte este QR con {{ nombreCompleto }}
              </p>
            </div>

            <!-- QR Code -->
            <div class="bg-white dark:bg-slate-900 rounded-xl p-6 border-2 border-dashed border-border">
              <div class="flex flex-col items-center gap-4">
                <img 
                  :src="invitacionCreada.qrCodeBase64" 
                  alt="Código QR"
                  class="w-64 h-64 rounded-lg"
                />
                <div class="flex gap-2">
                  <button
                    @click="descargarQR"
                    class="btn-outline flex items-center gap-2 px-4"
                  >
                    <Download class="w-4 h-4" />
                    Descargar
                  </button>
                  <button
                    @click="compartirQR"
                    class="btn flex items-center gap-2 px-4"
                    :class="{ 'bg-green-600 hover:bg-green-700': qrCopiado }"
                  >
                    <component :is="qrCopiado ? CheckCircle2 : Share2" class="w-4 h-4" />
                    {{ qrCopiado ? 'Copiado' : 'Compartir' }}
                  </button>
                </div>
              </div>
            </div>

            <!-- Info del transportista -->
            <div class="bg-hover rounded-lg p-4 space-y-2">
              <div class="flex justify-between text-sm">
                <span class="text-secondary">Nombre:</span>
                <span class="text-neutral font-medium">{{ nombreCompleto }}</span>
              </div>
              <div class="flex justify-between text-sm">
                <span class="text-secondary">Celular:</span>
                <span class="text-neutral font-medium">+591 {{ form.numeroCelular }}</span>
              </div>
              <div class="flex justify-between text-sm">
                <span class="text-secondary">Estado:</span>
                <span class="text-neutral font-medium">{{ invitacionCreada.estado }}</span>
              </div>
              <div class="flex justify-between text-sm">
                <span class="text-secondary">Expira:</span>
                <span class="text-neutral font-medium">
                  {{ new Date(invitacionCreada.fechaExpiracion).toLocaleDateString('es-BO', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric'
                  }) }}
                </span>
              </div>
            </div>

            <!-- Instrucciones -->
            <div class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div class="flex gap-3">
                <AlertTriangle class="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0" />
                <div>
                  <h4 class="text-sm font-semibold text-neutral mb-1">
                    Próximos pasos
                  </h4>
                  <p class="text-xs text-secondary">
                    1. Comparte este QR con el transportista por WhatsApp o cualquier medio<br>
                    2. El transportista debe escanear el QR desde la app móvil SumajFlow<br>
                    3. Recibirá un código de verificación en su WhatsApp<br>
                    4. Podrá completar su registro con los datos del vehículo
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>

        <!-- Footer -->
        <div class="flex gap-3 p-6 border-t border-border sticky bottom-0 bg-surface">
          <button
            v-if="!invitacionCreada"
            @click="emit('close')"
            class="flex-1 btn-secondary"
            :disabled="isProcessing"
          >
            Cancelar
          </button>
          <button
            v-if="!invitacionCreada"
            @click="crearInvitacion"
            :disabled="!isFormValid || isProcessing"
            class="flex-1 btn flex items-center justify-center gap-2"
          >
            <Loader2 v-if="isProcessing" class="w-4 h-4 animate-spin" />
            <QrCode v-else class="w-4 h-4" />
            <span>{{ isProcessing ? 'Generando...' : 'Generar QR' }}</span>
          </button>
          <button
            v-else
            @click="cerrarYNotificar"
            class="flex-1 btn"
          >
            Entendido
          </button>
        </div>

      </div>
    </div>
  </Teleport>
</template>