// application/hooks/useDomicilioForm.ts

import { useState, useCallback, useRef } from 'react'
import { Alert } from 'react-native'
import { useDomicilios } from '../context/DomiciliosContext'
import type { Domicilio, DomicilioCreate, Coordenadas } from '../../domain/entities/Domicilio'

export type DomicilioFormState = {
  alias:         string
  calle:            string
  numeroExt:        string
  numeroInt:        string
  colonia:          string
  ciudad:           string
  estado:           string
  pais:             string
  codigoPostal:     string
  referencias:      string
  coordenadas:      Coordenadas | null
  esPredeterminado: boolean
}

export type DomicilioFormErrors = Partial<Record<keyof DomicilioFormState, string>>

const INITIAL: DomicilioFormState = {
  alias: 'Casa', calle: '', numeroExt: '', numeroInt: '',
  colonia: '', ciudad: '', estado: '', pais: 'MX',
  codigoPostal: '', referencias: '', coordenadas: null,
  esPredeterminado: false,
}

function fromDomicilio(d: Domicilio): DomicilioFormState {
  return {
    alias:         d.alias,
    calle:            d.calle,
    numeroExt:        d.numeroExt     ?? '',
    numeroInt:        d.numeroInt     ?? '',
    colonia:          d.colonia       ?? '',
    ciudad:           d.ciudad        ?? '',
    estado:           d.estado        ?? '',
    pais:             d.pais,
    codigoPostal:     d.codigoPostal  ?? '',
    referencias:      d.referencias   ?? '',
    coordenadas:      d.coordenadas,
    esPredeterminado: d.esPredeterminado,
  }
}

export const useDomicilioForm = (domicilioExistente?: Domicilio) => {
  const { createDomicilio, updateDomicilio, isLoading } = useDomicilios()

  const [form,    setForm]    = useState<DomicilioFormState>(
    domicilioExistente ? fromDomicilio(domicilioExistente) : INITIAL
  )
  const [errors,  setErrors]  = useState<DomicilioFormErrors>({})
  const [success, setSuccess] = useState(false)

  // Ref para evitar closure stale en submit
  const formRef = useRef(form)
  formRef.current = form

  const setField = useCallback(<K extends keyof DomicilioFormState>(
    key: K, value: DomicilioFormState[K]
  ) => {
    setForm(prev => ({ ...prev, [key]: value }))
    setErrors(prev => ({ ...prev, [key]: undefined }))
  }, [])

  const onMapPinDrop = useCallback((coords: Coordenadas) => {
    setForm(prev => ({ ...prev, coordenadas: coords }))
  }, [])

  const validate = (f: DomicilioFormState): boolean => {
    const errs: DomicilioFormErrors = {}
    if (!f.calle.trim()) errs.calle = 'La calle es obligatoria.'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const submit = useCallback(async (): Promise<Domicilio | null> => {
    const currentForm = formRef.current
    if (!validate(currentForm)) return null

    const payload: DomicilioCreate = {
      alias:         currentForm.alias        || 'Casa',
      calle:            currentForm.calle.trim(),
      numeroExt:        currentForm.numeroExt       || undefined,
      numeroInt:        currentForm.numeroInt       || undefined,
      colonia:          currentForm.colonia         || undefined,
      ciudad:           currentForm.ciudad.trim()   || undefined,
      estado:           currentForm.estado          || undefined,
      pais:             currentForm.pais            || 'MX',
      codigoPostal:     currentForm.codigoPostal    || undefined,
      referencias:      currentForm.referencias     || undefined,
      coordenadas:      currentForm.coordenadas     ?? undefined,
      esPredeterminado: currentForm.esPredeterminado,
    }

    try {
      const result = domicilioExistente
        ? await updateDomicilio(domicilioExistente.id, payload)
        : await createDomicilio(payload)
      setSuccess(true)
      return result
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Error al guardar.'
      Alert.alert('Error al guardar', msg)
      return null
    }
  }, [domicilioExistente, createDomicilio, updateDomicilio])

  const reset = useCallback(() => {
    setForm(domicilioExistente ? fromDomicilio(domicilioExistente) : INITIAL)
    setErrors({})
    setSuccess(false)
  }, [domicilioExistente])

  return { form, errors, success, isLoading, setField, onMapPinDrop, submit, reset }
}