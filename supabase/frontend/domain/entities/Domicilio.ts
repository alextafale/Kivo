// domain/entities/Domicilio.ts
// Modelo puro — sin imports externos

export type Coordenadas = {
  latitud:  number
  longitud: number
}

export type Domicilio = {
  id:               string
  userId:           string
  etiqueta:         string
  calle:            string
  numeroExt:        string | null
  numeroInt:        string | null
  colonia:          string | null
  ciudad:           string | null
  estado:           string | null
  pais:             string
  codigoPostal:     string | null
  referencias:      string | null
  coordenadas:      Coordenadas | null
  esPredeterminado: boolean
  activo:           boolean
  creadoEn:         string
  actualizadoEn:    string
}

export type DomicilioCreate = {
  etiqueta?:         string
  calle:             string
  numeroExt?:        string
  numeroInt?:        string
  colonia?:          string
  ciudad?:           string
  estado?:           string
  pais?:             string
  codigoPostal?:     string
  referencias?:      string
  coordenadas?:      Coordenadas
  esPredeterminado?: boolean
}

export type DomicilioUpdate = Partial<DomicilioCreate>

export const ETIQUETAS = ['Casa', 'Trabajo', 'Gym', 'Otro'] as const
export type Etiqueta = typeof ETIQUETAS[number]