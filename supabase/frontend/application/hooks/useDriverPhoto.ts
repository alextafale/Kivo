import { useState, useCallback } from 'react'
import * as ImagePicker from 'expo-image-picker'
import { Alert } from 'react-native'
import { RepartidorRepositoryImpl } from '../../infraestructure/repositories/RepartidorRepositoryImpl'
import type { RepartidorInfo } from '../../domain/ports/repositories/lRepartidorRepository'

const repartidorRepo = new RepartidorRepositoryImpl()

type UseDriverProfileResult = {
  isUploading:   boolean
  pickAndUpload: (repartidor: RepartidorInfo, onSuccess: (url: string) => void) => Promise<void>
}

// Hook que encapsula la lógica de selección y subida de foto del repartidor
export const useDriverPhoto = (): UseDriverProfileResult => {
  const [isUploading, setIsUploading] = useState(false)

  const pickAndUpload = useCallback(
    async (repartidor: RepartidorInfo, onSuccess: (url: string) => void) => {
      // Solicita permiso a la galería
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
      if (status !== 'granted') {
        Alert.alert('Permiso requerido', 'Necesitamos acceso a tu galería para cambiar tu foto.')
        return
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],   // recorte cuadrado
        quality: 0.75,
      })

      if (result.canceled || !result.assets[0]) return

      const asset    = result.assets[0]
      const mimeType = asset.mimeType ?? 'image/jpeg'

      // Muestra optimistamente la imagen local mientras sube
      onSuccess(asset.uri)
      setIsUploading(true)

      try {
        const publicUrl = await repartidorRepo.uploadFoto(repartidor.id, asset.uri, mimeType)
        await repartidorRepo.updateFotoUrl(repartidor.id, publicUrl)
        // Reemplaza la URI local con la URL pública definitiva
        onSuccess(publicUrl)
      } catch (e: any) {
        Alert.alert('Error', 'No se pudo subir la foto. Intenta de nuevo.')
        console.error('[useDriverPhoto]', e.message)
      } finally {
        setIsUploading(false)
      }
    },
    [],
  )

  return { isUploading, pickAndUpload }
}