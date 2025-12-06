// src/stores/filesStore.js
import { defineStore } from 'pinia'
import rutaApi from '../assets/rutaApi'

export const useFilesStore = defineStore('files', () => {
    
    function openFile(objectName) {
        window.open(`${rutaApi}/files/${objectName}`, '_blank')
    }
    
    return {
        openFile
    }
})