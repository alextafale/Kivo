// ─── México: Estados y Ciudades ────────────────────────────────────────────────
// Contiene los 31 estados + CDMX con sus principales ciudades/municipios.

export interface EstadoData {
  nombre: string
  ciudades: string[]
}

export const ESTADOS_MEXICO: EstadoData[] = [
  {
    nombre: 'Aguascalientes',
    ciudades: [
      'Aguascalientes', 'Jesús María', 'Calvillo', 'Rincón de Romos',
      'Pabellón de Arteaga', 'Tepezalá', 'San Francisco de los Romo',
      'El Llano', 'Cosío', 'Asientos', 'San José de Gracia',
    ],
  },
  {
    nombre: 'Baja California',
    ciudades: [
      'Tijuana', 'Mexicali', 'Ensenada', 'Rosarito', 'Tecate',
      'San Felipe', 'Valle de Guadalupe', 'Maneadero', 'Punta Banda',
      'Colonia Guerrero', 'San Quintín', 'El Sauzal',
    ],
  },
  {
    nombre: 'Baja California Sur',
    ciudades: [
      'La Paz', 'Los Cabos', 'Loreto', 'Mulegé', 'Comondú',
      'Cabo San Lucas', 'San José del Cabo', 'Ciudad Constitución',
      'Santa Rosalía', 'Guerrero Negro', 'Todos Santos',
    ],
  },
  {
    nombre: 'Campeche',
    ciudades: [
      'Campeche', 'Ciudad del Carmen', 'Champotón', 'Calkiní',
      'Hecelchakán', 'Escárcega', 'Candelaria', 'Palizada',
      'Hopelchén', 'Tenabo', 'Calakmul',
    ],
  },
  {
    nombre: 'Chiapas',
    ciudades: [
      'Tuxtla Gutiérrez', 'San Cristóbal de las Casas', 'Tapachula',
      'Comitán', 'Ocosingo', 'Palenque', 'Chiapa de Corzo',
      'Tonalá', 'Arriaga', 'Pichucalco', 'Villaflores', 'Motozintla',
      'Huixtla', 'Reforma', 'Las Margaritas', 'Altamirano',
    ],
  },
  {
    nombre: 'Chihuahua',
    ciudades: [
      'Chihuahua', 'Ciudad Juárez', 'Delicias', 'Cuauhtémoc',
      'Parral', 'Nuevo Casas Grandes', 'Guachochi', 'Ojinaga',
      'Jiménez', 'Camargo', 'Bocoyna', 'Casas Grandes',
      'Meoqui', 'Saucillo', 'Madera', 'Guerrero',
    ],
  },
  {
    nombre: 'Ciudad de México',
    ciudades: [
      'Álvaro Obregón', 'Azcapotzalco', 'Benito Juárez', 'Coyoacán',
      'Cuajimalpa de Morelos', 'Cuauhtémoc', 'Gustavo A. Madero', 'Iztacalco',
      'Iztapalapa', 'La Magdalena Contreras', 'Miguel Hidalgo', 'Milpa Alta',
      'Tláhuac', 'Tlalpan', 'Venustiano Carranza', 'Xochimilco',
    ],
  },
  {
    nombre: 'Coahuila',
    ciudades: [
      'Saltillo', 'Torreón', 'Monclova', 'Piedras Negras', 'Acuña',
      'San Pedro de las Colonias', 'Ramos Arizpe', 'Frontera',
      'Sabinas', 'Nueva Rosita', 'Allende', 'Parras de la Fuente',
      'Castaños', 'Nadadores', 'Muzquiz', 'Zaragoza',
    ],
  },
  {
    nombre: 'Colima',
    ciudades: [
      'Colima', 'Manzanillo', 'Tecomán', 'Villa de Álvarez',
      'Armería', 'Cuauhtémoc', 'Ixtlahuacán', 'Comala',
      'Minatitlán', 'Coquimatlán',
    ],
  },
  {
    nombre: 'Durango',
    ciudades: [
      'Durango', 'Gómez Palacio', 'El Salto', 'Lerdo', 'Canatlán',
      'Santiago Papasquiaro', 'Cuencamé', 'Poanas', 'Pueblo Nuevo',
      'Tlahualilo', 'Súchil', 'Tamazula', 'Tepehuanes', 'Nombre de Dios',
    ],
  },
  {
    nombre: 'Estado de México',
    ciudades: [
      'Ecatepec de Morelos', 'Toluca', 'Naucalpan de Juárez', 'Nezahualcóyotl',
      'Chimalhuacán', 'Tlalnepantla de Baz', 'Ixtapaluca', 'Tultitlán',
      'Cuautitlán Izcalli', 'Atizapán de Zaragoza', 'Texcoco', 'Valle de Bravo',
      'Metepec', 'Chalco', 'Coacalco de Berriozábal', 'Zumpango',
      'Nicolás Romero', 'Huixquilucan', 'Tecámac', 'Tultepec',
      'Tenango del Valle', 'Lerma', 'Tepotzotlán', 'Jilotepec',
    ],
  },
  {
    nombre: 'Guanajuato',
    ciudades: [
      'León', 'Irapuato', 'Celaya', 'Salamanca', 'Guanajuato',
      'Silao', 'San Miguel de Allende', 'Dolores Hidalgo', 'Pénjamo',
      'Acámbaro', 'Cortazar', 'Villagrán', 'Juventino Rosas',
      'Abasolo', 'Valle de Santiago', 'Moroleón', 'Uriangato',
    ],
  },
  {
    nombre: 'Guerrero',
    ciudades: [
      'Acapulco', 'Chilpancingo', 'Zihuatanejo', 'Iguala', 'Taxco',
      'Tlapa de Comonfort', 'Chilapa de Álvarez', 'Teloloapan',
      'Arcelia', 'Petatlán', 'Tecpan de Galeana', 'La Unión',
      'Ayutla de los Libres', 'Ometepec', 'Cruz Grande',
    ],
  },
  {
    nombre: 'Hidalgo',
    ciudades: [
      'Pachuca', 'Tulancingo', 'Tula de Allende', 'Huejutla de Reyes',
      'Actopan', 'Mineral de la Reforma', 'Ixmiquilpan', 'Tizayuca',
      'Zimapán', 'Apan', 'Tepeji del Río', 'Huichapan',
      'Tasquillo', 'Atitalaquia', 'Molango', 'Zacualtipán',
    ],
  },
  {
    nombre: 'Jalisco',
    ciudades: [
      'Guadalajara', 'Zapopan', 'Tlaquepaque', 'Tonalá', 'Tlajomulco de Zúñiga',
      'Puerto Vallarta', 'Lagos de Moreno', 'Tepatitlán de Morelos', 'Ocotlán',
      'Ameca', 'Ciudad Guzmán', 'Autlán de Navarro', 'Chapala',
      'La Barca', 'Arandas', 'Tequila', 'Cihuatlán', 'San Juan de los Lagos',
      'Zapotiltic', 'Tapalpa', 'Casimiro Castillo',
    ],
  },
  {
    nombre: 'Michoacán',
    ciudades: [
      'Morelia', 'Zamora', 'Uruapan', 'Apatzingán', 'Lázaro Cárdenas',
      'Zitácuaro', 'Sahuayo', 'Pátzcuaro', 'Jacona', 'Maravatío',
      'La Piedad', 'Paracho', 'Purépero', 'Tepalcatepec',
      'Tingüindín', 'Ziracuaretiro', 'Taretan', 'Nuevo Urecho',
      'Urandén del Río', 'San Juan Nuevo Parangaricutiro',
      'Hidalgo', 'Huetamo', 'Tacámbaro', 'Marcos Castellanos',
      'Jiquilpan', 'Venustiano Carranza', 'Yuréndaro', 'Pajacuarán',
      'Tanhuato', 'Briseñas', 'Vista Hermosa', 'Yurécuaro',
    ],
  },
  {
    nombre: 'Morelos',
    ciudades: [
      'Cuernavaca', 'Cuautla', 'Jiutepec', 'Temixco', 'Yautepec',
      'Jojutla', 'Zacatepec', 'Puente de Ixtla', 'Xochitepec',
      'Emiliano Zapata', 'Ayala', 'Tetela del Volcán', 'Tepoztlán',
    ],
  },
  {
    nombre: 'Nayarit',
    ciudades: [
      'Tepic', 'Bahía de Banderas', 'Santiago Ixcuintla', 'Ixtlán del Río',
      'Acaponeta', 'Compostela', 'Tuxpan', 'Rosamorada',
      'Ruíz', 'Del Nayar', 'La Yesca', 'Ahuacatlán',
    ],
  },
  {
    nombre: 'Nuevo León',
    ciudades: [
      'Monterrey', 'Guadalupe', 'San Nicolás de los Garza', 'Apodaca',
      'General Escobedo', 'Santa Catarina', 'San Pedro Garza García',
      'Juárez', 'Linares', 'Cadereyta Jiménez', 'García',
      'Montemorelos', 'Allende', 'Sabinas Hidalgo', 'China',
      'Lampazos de Naranjo', 'Anáhuac', 'Cerralvo',
    ],
  },
  {
    nombre: 'Oaxaca',
    ciudades: [
      'Oaxaca de Juárez', 'Salina Cruz', 'San Juan Mixtepec',
      'Juchitán de Zaragoza', 'Tuxtepec', 'Huajuapan de León',
      'Pochutla', 'Puerto Escondido', 'Miahuatlán de Porfirio Díaz',
      'Tehuantepec', 'Ocotlán de Morelos', 'Zimatlán de Álvarez',
      'Tlacolula de Matamoros', 'Ixtepec', 'Putla Villa de Guerrero',
    ],
  },
  {
    nombre: 'Puebla',
    ciudades: [
      'Puebla', 'Tehuacán', 'San Martín Texmelucan', 'Cholula',
      'Atlixco', 'Huauchinango', 'Izúcar de Matamoros', 'San Andrés Cholula',
      'Acatzingo', 'Amozoc', 'Zacatlán', 'Chignahuapan',
      'Libres', 'Teziutlán', 'Xicotepec de Juárez', 'Ajalpan',
      'Tecamachalco', 'Huejotzingo',
    ],
  },
  {
    nombre: 'Querétaro',
    ciudades: [
      'Querétaro', 'San Juan del Río', 'Corregidora', 'El Marqués',
      'Tequisquiapan', 'Ezequiel Montes', 'Cadereyta de Montes',
      'Amealco de Bonfil', 'Colón', 'Pedro Escobedo', 'Jalpan de Serra',
    ],
  },
  {
    nombre: 'Quintana Roo',
    ciudades: [
      'Cancún', 'Playa del Carmen', 'Cozumel', 'Chetumal',
      'Tulum', 'Felipe Carrillo Puerto', 'Bacalar', 'Isla Mujeres',
      'Akumal', 'Puerto Morelos', 'Holbox', 'Lázaro Cárdenas',
    ],
  },
  {
    nombre: 'San Luis Potosí',
    ciudades: [
      'San Luis Potosí', 'Soledad de Graciano Sánchez', 'Ciudad Valles',
      'Matehuala', 'Rioverde', 'Tamazunchale', 'Ebano',
      'Cd. Fernández', 'Charcas', 'Cerritos', 'Salinas de Hidalgo',
      'Mexquitic de Carmona', 'Tamuín', 'Villa de Reyes',
    ],
  },
  {
    nombre: 'Sinaloa',
    ciudades: [
      'Culiacán', 'Mazatlán', 'Los Mochis', 'Guasave', 'Guamúchil',
      'Navolato', 'Mocorito', 'Angostura', 'Escuinapa',
      'El Rosario', 'Choix', 'Badiraguato', 'Cosalá',
    ],
  },
  {
    nombre: 'Sonora',
    ciudades: [
      'Hermosillo', 'Ciudad Obregón', 'Nogales', 'San Luis Río Colorado',
      'Guaymas', 'Navojoa', 'Agua Prieta', 'Caborca',
      'Puerto Peñasco', 'Empalme', 'Magdalena de Kino', 'Huatabampo',
      'Cananea', 'Imuris', 'Altar', 'Ures',
    ],
  },
  {
    nombre: 'Tabasco',
    ciudades: [
      'Villahermosa', 'Cárdenas', 'Comalcalco', 'Macuspana',
      'Paraíso', 'Tenosique', 'Huimanguillo', 'Jalpa de Méndez',
      'Cunduacán', 'Nacajuca', 'Centla', 'Emiliano Zapata',
      'Balancán', 'Jonuta',
    ],
  },
  {
    nombre: 'Tamaulipas',
    ciudades: [
      'Reynosa', 'Matamoros', 'Tampico', 'Nuevo Laredo', 'Ciudad Victoria',
      'Altamira', 'Madero', 'Río Bravo', 'Valle Hermoso',
      'San Fernando', 'Mante', 'Tula', 'Padilla',
      'Soto la Marina', 'Gustavo Díaz Ordaz', 'Miguel Alemán',
    ],
  },
  {
    nombre: 'Tlaxcala',
    ciudades: [
      'Tlaxcala', 'Apizaco', 'Chiautempan', 'Huamantla', 'Calpulalpan',
      'Zacatelco', 'Tlaxco', 'Amaxac de Guerrero', 'San Pablo del Monte',
      'Xaltocan', 'Ixtenco', 'Terrenate',
    ],
  },
  {
    nombre: 'Veracruz',
    ciudades: [
      'Veracruz', 'Xalapa', 'Coatzacoalcos', 'Córdoba', 'Orizaba',
      'Poza Rica', 'Tuxpan', 'Minatitlán', 'Papantla', 'Martínez de la Torre',
      'San Andrés Tuxtla', 'Cosamaloapan', 'Tierra Blanca', 'Boca del Río',
      'Cosoleacaque', 'Nanchital', 'Las Choapas', 'Álamo Temapache',
      'Perote', 'Nogales', 'Tantoyuca', 'Tlapacoyan',
    ],
  },
  {
    nombre: 'Yucatán',
    ciudades: [
      'Mérida', 'Valladolid', 'Progreso', 'Tizimín', 'Motul',
      'Tekax', 'Ticul', 'Oxkutzcab', 'Izamal', 'Hunucmá',
      'Umán', 'Maxcanú', 'Celestún', 'Espita', 'Peto',
    ],
  },
  {
    nombre: 'Zacatecas',
    ciudades: [
      'Zacatecas', 'Fresnillo', 'Guadalupe', 'Calera', 'Jerez',
      'Loreto', 'Río Grande', 'Sombrerete', 'Juan Aldama',
      'Jalpa', 'Tlaltenango', 'Villanueva', 'Ojocaliente',
      'Nochistlán de Mejía', 'Valparaíso', 'Moyahua de Estrada',
    ],
  },
]

export const NOMBRES_ESTADOS = ESTADOS_MEXICO.map(e => e.nombre)

export function getCiudadesByEstado(estado: string): string[] {
  return ESTADOS_MEXICO.find(e => e.nombre === estado)?.ciudades ?? []
}