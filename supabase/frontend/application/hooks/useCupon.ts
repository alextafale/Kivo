import { useState, useCallback, useRef } from 'react'
import { CuponRepositoryImpl } from '../../infraestructure/repositories/CuponRepositoryImpl'
import type { CuponValidacion } from '../../domain/entities/Cupon'

const cuponRepo = new CuponRepositoryImpl()

// Hook para validar y aplicar un cupón en el resumen del pedido
export const useCupon = (negocioId: string, subtotal: number) => {
  const [codigo, setCodigo] = useState('')
  const [validacion, setValidacion] = useState<CuponValidacion | null>(null)
  const [isValidating, setIsValidating] = useState(false)
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Valida el cupón contra Supabase con debounce de 600ms
  const validarCupon = useCallback(async (codigoInput: string) => {
    if (!codigoInput.trim()) {
      setValidacion(null)
      return
    }
    setIsValidating(true)
    try {
      const resultado = await cuponRepo.validarCupon(
        codigoInput.trim().toUpperCase(),
        subtotal,
        negocioId
      )
      setValidacion(resultado)
    } catch {
      setValidacion({
        valido: false,
        cupon: null,
        descuento: 0,
        mensajeError: 'Error de conexión, intenta de nuevo',
      })
    } finally {
      setIsValidating(false)
    }
  }, [subtotal, negocioId])

  // Maneja cambio en el input con debounce para no disparar en cada tecla
  const onCodigoChange = useCallback((text: string) => {
    const upper = text.toUpperCase()
    setCodigo(upper)
    setValidacion(null)

    if (debounceTimer.current) clearTimeout(debounceTimer.current)

    if (upper.length >= 3) {
      debounceTimer.current = setTimeout(() => {
        validarCupon(upper)
      }, 600)
    }
  }, [validarCupon])

  // Dispara validación inmediata al presionar "Aplicar"
  const aplicarCupon = useCallback(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current)
    validarCupon(codigo)
  }, [codigo, validarCupon])

  // Limpia el cupón aplicado
  const limpiarCupon = useCallback(() => {
    setCodigo('')
    setValidacion(null)
    if (debounceTimer.current) clearTimeout(debounceTimer.current)
  }, [])

  const descuentoAplicado = validacion?.valido ? validacion.descuento : 0

  return {
    codigo,
    validacion,
    isValidating,
    descuentoAplicado,
    onCodigoChange,
    aplicarCupon,
    limpiarCupon,
  }
}