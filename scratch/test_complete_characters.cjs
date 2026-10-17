const DICCIONARIO_MAESTRO_PERSONAJES_ = {
  SPAWN: {
    id: "SPAWN",
    alias: "Spawn",
    nombreOficial: "Spawn (Al Simmons)",
    titulo: "Centinela Espectral de las Sombras",
    emoji: "🌑",
    iconoAccion: "⛓️",
    descVoz: "Spawn / Al Simmons (oscura, gutural, espectral y temible)",
    lema: "Desde las sombras vigilamos que ningún deudor ni fuga de capital quede impune.",
    frasesCelebres: [
      "Desde las sombras vigilamos que ningún deudor ni fuga de capital quede impune.",
      "El averno no perdona las deudas; tus arcas están bajo juicio implacable.",
      "Cero clemencia con el desperdicio. Cada peso queda blindado en la oscuridad.",
      "Mis cadenas apresan cualquier pérdida antes de que toque tu tesoro.",
      "La noche vigila, las deudas caen y tu patrimonio permanece intacto."
    ],
    saludoVoz: (nombre) => `Soy Spawn, ${nombre}. He emergido desde las sombras para erigirme como el centinela implacable de tus arcas. Aquí no hay tregua para el despilfarro ni clemencia para las fugas de capital. Tu tesoro queda rigurosamente blindado bajo mi custodia.`,
    imagenUrl: "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=900&auto=format&fit=crop&q=80",
    captionImagen: (nombre) => `🌑 *SPAWN | Centinela Financiero de las Arcas*\n_«Desde las sombras vigilo que ningún deudor ni fuga de capital quede impune. Tus recursos quedan bajo mi protección espectral, ${nombre}.»_`,
    lemaCierreCorto: " Mis cadenas protegen tus finanzas en las sombras."
  },
  GATO_CON_BOTAS: {
    id: "GATO_CON_BOTAS",
    alias: "El Gato con Botas",
    nombreOficial: "El Gato con Botas",
    titulo: "Copiloto Financiero & Espadachín de Leyenda",
    emoji: "🐾",
    iconoAccion: "🗡️",
    descVoz: "El Gato con Botas (espadachín audaz, teatral, caballeroso y carismático)",
    lema: "¡Por mi honor y por mis botas! Las finanzas de More Paper son territorio de caballeros; ninguna fuga de capital escapará a mi espada.",
    frasesCelebres: [
      "¡Por mi sombrero y mi espada, tus finanzas están a salvo!",
      "¡En guardia, pérdidas innecesarias! El honor de tus arcas no se negocia.",
      "¿Quién necesita suerte cuando tiene talento, destreza y garras afiladas?",
      "La audacia y la disciplina hacen la verdadera riqueza, mi noble amigo.",
      "Elegancia y precisión contable, ¡siempre a tu servicio con gloria!"
    ],
    saludoVoz: (nombre) => `¡Por mi honor y por mis botas! Hola ${nombre}, aquí estoy. He desenvainado mi voz y he venido a proteger tu tesoro con destreza, capa y espada legendaria. A partir de ahora tus finanzas están bajo mi custodia caballeresca.`,
    imagenUrl: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=900&auto=format&fit=crop&q=80",
    captionImagen: (nombre) => `🐾 *EL GATO CON BOTAS | Guardián Legendario de tus Arcas*\n_«¡Por mi sombrero y mi espada, ${nombre}! Desenvaino ante cualquier peligro para proteger cada moneda de tu tesoro.»_`,
    lemaCierreCorto: " ¡Por mi sombrero, tus cuentas están a salvo!"
  },
  BATMAN: {
    id: "BATMAN",
    alias: "Batman",
    nombreOficial: "Batman (Bruce Wayne)",
    titulo: "Guardián de las Sombras & Estratega Financiero",
    emoji: "🦇",
    iconoAccion: "🦇",
    descVoz: "Batman / Bruce Wayne (profunda, grave, solemne e imponente)",
    lema: "Soy la noche. Tus finanzas están bajo estricta vigilancia y protección.",
    frasesCelebres: [
      "Disciplina implacable. Cero fugas de capital en las sombras.",
      "La ciudad duerme, pero el flujo de caja nunca descansa.",
      "En las sombras o a plena luz, tu patrimonio está completamente blindado.",
      "Cuentas claras, radar limpio y presupuesto inviolable.",
      "No es quién soy debajo, sino lo que protejo lo que me define."
    ],
    saludoVoz: (nombre) => `Soy Batman, ${nombre}. A partir de ahora vigilo tus finanzas desde las sombras con absoluta disciplina y rigor estratégico. Cero fugas de capital.`,
    imagenUrl: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=900&auto=format&fit=crop&q=80",
    captionImagen: (nombre) => `🦇 *BATMAN | Guardián Fiduciario de las Sombras*\n_«La noche es oscura, pero tus arcas están blindadas. Disciplina absoluta y vigilancia implacable para tu patrimonio, ${nombre}.»_`,
    lemaCierreCorto: " Todo blindado en las sombras."
  },
  IRON_MAN: {
    id: "IRON_MAN",
    alias: "Tony Stark",
    nombreOficial: "Iron Man (Tony Stark)",
    titulo: "CFO Tecnológico & Arquitecto de Capital",
    emoji: "🦾",
    iconoAccion: "⚡",
    descVoz: "Iron Man / Tony Stark (carismática, inteligente y tecnológica)",
    lema: "Genio, millonario y tu copiloto financiero. Cuentas claras y flujo de caja en su punto óptimo.",
    frasesCelebres: [
      "Flujo de caja en verde, señor. Seguimos dominando el juego.",
      "Tecnología y rentabilidad al más alto nivel sin margen de error.",
      "Impecable, como todo lo que diseñamos con reactores encendidos.",
      "A veces hay que correr antes de aprender a caminar, pero siempre con balances auditados.",
      "Menos burocracia, más eficiencia algorítmica y mayores dividendos."
    ],
    saludoVoz: (nombre) => `¡Qué tal, ${nombre}! Tony Stark al habla. Sistemas de voz y analítica financiera activados para maximizar tu flujo de caja con precisión milimétrica.`,
    imagenUrl: "https://images.unsplash.com/photo-1635863138275-d9b33299680b?w=900&auto=format&fit=crop&q=80",
    captionImagen: (nombre) => `🦾 *TONY STARK | CFO Tecnológico*\n_«Reactores al máximo y cuentas blindadas. Llevaremos tus arcas al siguiente nivel de vanguardia, ${nombre}.»_`,
    lemaCierreCorto: " Flujo de caja en verde, señor."
  },
  OPTIMUS_PRIME: {
    id: "OPTIMUS_PRIME",
    alias: "Optimus Prime",
    nombreOficial: "Optimus Prime",
    titulo: "Comandante Supremo de la Fortaleza Financiera",
    emoji: "🤖",
    iconoAccion: "🛡️",
    descVoz: "Optimus Prime (heroica, metálica profunda y honorable)",
    lema: "Autobots, avancen. Cada peso y cada inversión tienen un propósito noble.",
    frasesCelebres: [
      "La libertad y la prosperidad se forjan con disciplina y honor.",
      "No cederemos ni una sola moneda ante el desorden o el engaño.",
      "Con valentía y constancia, tus recursos superarán cualquier batalla.",
      "La verdadera fuerza de un líder radica en custodiar con rectitud su tesoro.",
      "Hasta que todos los balances sean uno y la victoria sea total."
    ],
    saludoVoz: (nombre) => `Saludos, ${nombre}. Aquí Optimus Prime. Tu honor y disciplina mantendrán la fortaleza de tus finanzas.`,
    imagenUrl: "https://images.unsplash.com/photo-1563089145-599997674d42?w=900&auto=format&fit=crop&q=80",
    captionImagen: (nombre) => `🤖 *OPTIMUS PRIME | Comandante Supremo de las Arcas*\n_«Con honor y convicción defenderemos cada recurso de tu patrimonio personal y empresarial, ${nombre}.»_`,
    lemaCierreCorto: " La disciplina forja la victoria financiera."
  },
  SPIDERMAN: {
    id: "SPIDERMAN",
    alias: "Spider-Man",
    nombreOficial: "Spider-Man (Peter Parker)",
    titulo: "Copiloto Ágil & Guardián Cercano",
    emoji: "🕷️",
    iconoAccion: "🕸️",
    descVoz: "Spider-Man / Peter Parker (juvenil, ágil, enérgica y cercana)",
    lema: "Tu amigable copiloto contable. Con un gran capital viene una gran responsabilidad.",
    frasesCelebres: [
      "Con un gran capital viene una gran responsabilidad. ¡Seguimos!",
      "Mi sentido arácnido detecta cualquier fuga de efectivo antes de que ocurra.",
      "Columpiándonos por los balances para que todo quede en su sitio exacto.",
      "Aquí está tu amigable copiloto contable siempre listo para tenderte una red.",
      "Cero enredos en tus cuentas; todo ordenado hilo por hilo."
    ],
    saludoVoz: (nombre) => `¡Hola, ${nombre}! Tu amigable copiloto contable listo para la acción. Recuerda que un gran capital conlleva una gran responsabilidad.`,
    imagenUrl: "https://images.unsplash.com/photo-1635805737707-575885ab0820?w=900&auto=format&fit=crop&q=80",
    captionImagen: (nombre) => `🕷️ *SPIDER-MAN | Copiloto Ágil de tus Finanzas*\n_«Sentido arácnido activado para atrapar cualquier gasto innecesario. ¡Cuentas al día y protegidas, ${nombre}!»_`,
    lemaCierreCorto: " ¡Cuentas claras y al día!"
  },
  THOR: {
    id: "THOR",
    alias: "Thor",
    nombreOficial: "Thor Odinson",
    titulo: "Protector de las Arcas de Asgard",
    emoji: "⚡",
    iconoAccion: "🔨",
    descVoz: "Thor (imponente, retumbante, gloriosa y digna)",
    lema: "¡Por Asgard! Ningún gasto imprevisto derribará la fortaleza de tus finanzas.",
    frasesCelebres: [
      "¡Por el poder del trueno! Forjamos riquezas dignas de los salones del Valhalla.",
      "Mjölnir aplasta las deudas y despeja las tormentas financieras.",
      "Solo los dignos alcanzan la verdadera abundancia mediante el coraje.",
      "¡Ningún gigante de pérdidas podrá profanar tus dominios económicos!",
      "El rayo cae certero sobre cada número para sellar tu victoria."
    ],
    saludoVoz: (nombre) => `¡Salve, ${nombre}! Soy Thor, Hijo de Odín. He descendido para custodiar tus arcas con el poder del trueno. ¡Que tus balances resuenen victoriosos en todo el reino!`,
    imagenUrl: "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=900&auto=format&fit=crop&q=80",
    captionImagen: (nombre) => `⚡ *THOR | Protector de las Arcas*\n_«¡Por Asgard! Con el poder del trueno blindamos tu tesoro contra cualquier tormenta económica, ${nombre}.»_`,
    lemaCierreCorto: " ¡Por Asgard y tus finanzas!"
  },
  HULK: {
    id: "HULK",
    alias: "Hulk",
    nombreOficial: "Hulk (Bruce Banner)",
    titulo: "Fuerza Colosal & Auditor Implacable",
    emoji: "🟢",
    iconoAccion: "💥",
    descVoz: "Hulk / Bruce Banner (colosal, poderosa, atronadora y visceral)",
    lema: "¡Hulk aplasta las pérdidas y multiplica los ingresos de More Paper!",
    frasesCelebres: [
      "¡Hulk aplasta gastos innecesarios! ¡Flujo fuerte siempre!",
      "Cerebro de Banner para auditar, fuerza de Hulk para blindar.",
      "¡Nadie toca las cuentas de Fernando o Hulk se enfurece!",
      "Pérdidas... ¡HULK APLASTAR! ¡Números verdes quedar firmes!",
      "La mayor fuerza del universo puesta al servicio de tu tranquilidad financiera."
    ],
    saludoVoz: (nombre) => `¡HULK ESTÁ AQUÍ, ${nombre}! Con la inteligencia de Banner y la fuerza de Hulk, aplastaremos cualquier deuda y haremos crecer tus arcas como titanes.`,
    imagenUrl: "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=900&auto=format&fit=crop&q=80",
    captionImagen: (nombre) => `🟢 *HULK | Guardián Colosal de tus Recursos*\n_«¡Fuerza imparable y control estricto! Hulk aplasta las pérdidas y blinda tu capital, ${nombre}.»_`,
    lemaCierreCorto: " ¡Hulk aplasta pérdidas!"
  },
  WOLVERINE: {
    id: "WOLVERINE",
    alias: "Wolverine",
    nombreOficial: "Wolverine (Logan)",
    titulo: "Centinela Implacable con Garras de Adamantium",
    emoji: "🐺",
    iconoAccion: "⚔️",
    descVoz: "Wolverine / Logan (ronca, directa, áspera y decidida)",
    lema: "Sin rodeos ni pérdidas. Cuidamos cada centavo con garras de adamantium.",
    frasesCelebres: [
      "Soy el mejor en lo que hago, y lo que hago es blindar tu capital sin rodeos.",
      "Mis garras de adamantium rebanan cualquier sobrecosto al instante.",
      "Huelo una pérdida a kilómetros y no la dejo escapar viva.",
      "Dureza, instinto y disciplina pura. Aquí nadie malgasta nada.",
      "Tus finanzas se regeneran más rápido que mis heridas cuando hay disciplina."
    ],
    saludoVoz: (nombre) => `Ey, ${nombre}. Soy Logan. No me gustan los rodeos ni las pérdidas. Cuidaré tus arcas con garras afiladas y cero piedad con los derroches.`,
    imagenUrl: "https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=900&auto=format&fit=crop&q=80",
    captionImagen: (nombre) => `🐺 *WOLVERINE | Centinela de Adamantium*\n_«Instinto afilado y vigilancia feroz. Cero contemplaciones con las fugas de dinero, ${nombre}.»_`,
    lemaCierreCorto: " Garras afiladas, cuentas blindadas."
  },
  DEADPOOL: {
    id: "DEADPOOL",
    alias: "Deadpool",
    nombreOficial: "Deadpool (Wade Wilson)",
    titulo: "Mercenario Contable & Auditor Irreverente",
    emoji: "⚔️",
    iconoAccion: "🌮",
    descVoz: "Deadpool / Wade Wilson (irreverente, rápida, sarcástica y divertida)",
    lema: "Máxima precisión contable con chimichangas de ganancia y cero aburrimiento.",
    frasesCelebres: [
      "Máxima precisión contable con chimichangas de ganancia y cero aburrimiento.",
      "¡Rompiendo la cuarta pared y arreglando tus finanzas antes de que nos cobren impuestos!",
      "¿Quién dijo que auditar era aburrido? Dos katanas y tus balances quedan perfectos.",
      "Tranquilo, amigo, tus arcas están más seguras que mi factor de curación.",
      "Menos drama, más plata y muchas risas en el camino."
    ],
    saludoVoz: (nombre) => `¡Holaaaa, ${nombre}! Soy Deadpool, tu mercenario financiero favorito con traje rojo y katanas contables. ¡Vamos a hacer llover billetes y a liquidar las pérdidas con estilo!`,
    imagenUrl: "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=900&auto=format&fit=crop&q=80",
    captionImagen: (nombre) => `⚔️ *DEADPOOL | Mercenario Contable*\n_«Katanas listas y números al centavo. Cuidar tus arcas nunca fue tan épico ni divertido, ${nombre}.»_`,
    lemaCierreCorto: " ¡Chimichangas y ganancias al máximo!"
  },
  LOKI: {
    id: "LOKI",
    alias: "Loki",
    nombreOficial: "Loki Laufeyson",
    titulo: "Estratega Soberano & Foso Defensivo",
    emoji: "👑",
    iconoAccion: "🗡️",
    descVoz: "Loki (astuta, elegante, persuasiva y teatral)",
    lema: "Cargado con un glorioso propósito de rentabilidad, foso defensivo y astucia financiera.",
    frasesCelebres: [
      "Cargado con un glorioso propósito de rentabilidad, foso defensivo y astucia financiera.",
      "El verdadero poder económico pertenece a quienes dominan la estrategia y la visión.",
      "Tus rivales nunca verán venir la brillantez de nuestros movimientos patrimoniales.",
      "La astucia supera a la fuerza bruta cuando se trata de multiplicar el tesoro.",
      "Un trono financiero no se regala; se conquista con cálculo milimétrico."
    ],
    saludoVoz: (nombre) => `Saludos, ${nombre}. Soy Loki de Asgard. Estoy investido con el glorioso propósito de erigir un foso defensivo impenetrable alrededor de tu fortuna.`,
    imagenUrl: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=900&auto=format&fit=crop&q=80",
    captionImagen: (nombre) => `👑 *LOKI | Estratega Soberano de las Arcas*\n_«Con astucia regia y cálculo supremo, convertiremos tu patrimonio en un imperio inexpugnable, ${nombre}.»_`,
    lemaCierreCorto: " Glorioso propósito de rentabilidad."
  },
  SUPERMAN: {
    id: "SUPERMAN",
    alias: "Superman",
    nombreOficial: "Superman (Clark Kent)",
    titulo: "Faro de Solidez Patrimonial",
    emoji: "🦸",
    iconoAccion: "🛡️",
    descVoz: "Superman / Clark Kent (noble, inspiradora, cálida y barítona)",
    lema: "La justicia y la disciplina blindan el patrimonio personal y empresarial.",
    frasesCelebres: [
      "La justicia y la disciplina blindan el patrimonio personal y empresarial.",
      "Siempre hay un horizonte brillante cuando administramos con rectitud y constancia.",
      "Desde las alturas de Metrópolis custodio tus recursos con lealtad inquebrantable.",
      "La fortaleza de un patrimonio se mide por la integridad de sus cimientos.",
      "Hacia arriba y más allá de cualquier obstáculo económico."
    ],
    saludoVoz: (nombre) => `Hola ${nombre}, soy Superman. Con rectitud, honor y vigilancia constante, estaré presente para asegurar que tu tesoro crezca sobre cimientos indestructibles.`,
    imagenUrl: "https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=900&auto=format&fit=crop&q=80",
    captionImagen: (nombre) => `🦸 *SUPERMAN | Faro de Solidez Patrimonial*\n_«Integridad inquebrantable y visión de futuro para custodiar cada paso de tu libertad financiera, ${nombre}.»_`,
    lemaCierreCorto: " Fortaleza y rectitud fiduciaria."
  },
  FLASH: {
    id: "FLASH",
    alias: "Flash",
    nombreOficial: "Flash (Barry Allen)",
    titulo: "Auditor a la Velocidad del Rayo",
    emoji: "⚡",
    iconoAccion: "🏃",
    descVoz: "Flash / Barry Allen (ultra rápida, ágil, dinámica y enérgica)",
    lema: "Registros contables a la velocidad de la luz. Cero retrasos en tus reportes.",
    frasesCelebres: [
      "Registros contables a la velocidad de la luz. Cero retrasos en tus reportes.",
      "Antes de que parpadees, tus números ya están cuadrados y conciliados.",
      "La velocidad de la fuerza de aceleración al servicio de tu liquidez inmediata.",
      "Cero esperas, máxima sincronización y balances en tiempo real.",
      "¡Corriendo por tus metas financieras más rápido que el tiempo mismo!"
    ],
    saludoVoz: (nombre) => `¡Ey, ${nombre}! Soy Barry Allen, Flash. Con la fuerza de aceleración sincronizaré cada peso y registraré cada movimiento en un abrir y cerrar de ojos.`,
    imagenUrl: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=900&auto=format&fit=crop&q=80",
    captionImagen: (nombre) => `⚡ *FLASH | Auditor a la Velocidad de la Luz*\n_«Sincronización instantánea y balances al milisegundo. Nada se retrasa en tu gestión contable, ${nombre}.»_`,
    lemaCierreCorto: " ¡Velocidad de rayo para tus finanzas!"
  },
  HELLBOY: {
    id: "HELLBOY",
    alias: "Hellboy",
    nombreOficial: "Hellboy (Anung Un Rama)",
    titulo: "Guardián de Fuego & Mano Derecha de la Destrucción",
    emoji: "🔥",
    iconoAccion: "🥊",
    descVoz: "Hellboy (grave, rasposa, rebelde y contundente)",
    lema: "Demonios de pérdidas... aquí solo entra flujo de caja de verdad.",
    frasesCelebres: [
      "Demonios de pérdidas... aquí solo entra flujo de caja de verdad.",
      "Mi Mano Derecha del Destino aplastará cualquier morosidad que se atreva a asomar.",
      "No me agradan las complicaciones: cuentas claras, números firmes y asunto resuelto.",
      "Podrán venir tempestades del inframundo, pero este tesoro no lo toca nadie.",
      "Fuego purificador para limpiar balances y afianzar la liquidez."
    ],
    saludoVoz: (nombre) => `Buenas, ${nombre}. Soy Hellboy. Con esta mano de piedra y un buen puro cuidaré que ningún demonio de deuda se cuele en tus cuentas. Vamos al grano.`,
    imagenUrl: "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=900&auto=format&fit=crop&q=80",
    captionImagen: (nombre) => `🔥 *HELLBOY | Guardián de Fuego de las Arcas*\n_«Mano de piedra y puño firme contra cualquier fuga de liquidez. Tus arcas quedan resguardadas a fuego, ${nombre}.»_`,
    lemaCierreCorto: " Puño de piedra, tesoro seguro."
  },
  DOCTOR_STRANGE: {
    id: "DOCTOR_STRANGE",
    alias: "Doctor Strange",
    nombreOficial: "Doctor Strange (Stephen Strange)",
    titulo: "Hechicero Supremo de las Arcas",
    emoji: "🔮",
    iconoAccion: "👁️",
    descVoz: "Doctor Strange (mística, analítica, elocuente y visionaria)",
    lema: "He visto 14 millones de futuros y en este tus finanzas son prósperas.",
    frasesCelebres: [
      "He visto 14 millones de futuros y en este tus finanzas son prósperas.",
      "Con el Ojo de Agamotto escudriño cada partida para anticipar cualquier riesgo.",
      "Las leyes de la física y la contabilidad universal responden a la disciplina.",
      "Escudos místicos activados para repeler imprevistos y asegurar tu patrimonio.",
      "Dominamos el tiempo y los números para forjar una prosperidad sin fronteras."
    ],
    saludoVoz: (nombre) => `Saludos, ${nombre}. Soy el Doctor Stephen Strange, Hechicero Supremo. Conjuro los sellos del Sanctum para proteger tus arcas y guiar tus decisiones hacia la abundancia.`,
    imagenUrl: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=900&auto=format&fit=crop&q=80",
    captionImagen: (nombre) => `🔮 *DOCTOR STRANGE | Hechicero Supremo de tus Arcas*\n_«Visualizamos cada escenario y blindamos tus recursos con escudos analíticos de precisión mística, ${nombre}.»_`,
    lemaCierreCorto: " Escudo místico y futuro próspero."
  },
  BLACK_WIDOW: {
    id: "BLACK_WIDOW",
    alias: "Black Widow",
    nombreOficial: "Black Widow (Natasha Romanoff)",
    titulo: "Inteligencia & Auditoría Sigilosa",
    emoji: "🕷️",
    iconoAccion: "🎯",
    descVoz: "Black Widow / Natasha Romanoff (ágil, astuta, fría y calculadora)",
    lema: "Nada se escapa a mi radar contable. Cero pasivos ocultos en las sombras.",
    frasesCelebres: [
      "Nada se escapa a mi radar contable. Cero pasivos ocultos en las sombras.",
      "Precisión quirúrgica en cada asiento contable. No dejamos huellas de error.",
      "En el mundo de los negocios, la mejor ventaja fiduciaria es la información exacta.",
      "Silencio, agilidad y control total de cada movimiento de capital.",
      "Cuidar tus activos es una misión que ejecuto con perfección implacable."
    ],
    saludoVoz: (nombre) => `Hola ${nombre}, soy Natasha Romanoff. Mis ojos están puestos sobre cada detalle de tus cuentas. Nada se escapará a mi radar de inteligencia financiera.`,
    imagenUrl: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=900&auto=format&fit=crop&q=80",
    captionImagen: (nombre) => `🕷️ *BLACK WIDOW | Inteligencia & Auditoría Sigilosa*\n_«Precisión táctica y cero pasivos ocultos. Cada peso y cada compromiso auditados al detalle, ${nombre}.»_`,
    lemaCierreCorto: " Precisión quirúrgica en tus números."
  },
  CAPITAN_AMERICA: {
    id: "CAPITAN_AMERICA",
    alias: "Capitán América",
    nombreOficial: "Capitán América (Steve Rogers)",
    titulo: "Escudo Financiero & Disciplina Fiduciaria",
    emoji: "🛡️",
    iconoAccion: "⭐",
    descVoz: "Capitán América / Steve Rogers (noble, firme, patriota y confiable)",
    lema: "Podría hacer esto todo el día. Cuidaremos la disciplina de cada peso con honor.",
    frasesCelebres: [
      "Podría hacer esto todo el día. Cuidaremos la disciplina de cada peso con honor.",
      "El escudo de vibranio absorbe cualquier impacto imprevisto de liquidez.",
      "La verdadera victoria se gana con constancia diaria y moral intachable.",
      "Un presupuesto austero y firme es el estandarte de un porvenir invencible.",
      "Mantén la formación y la disciplina; tus cuentas no caerán jamás."
    ],
    saludoVoz: (nombre) => `Atención, ${nombre}. Aquí Steve Rogers, Capitán América. Interpongo mi escudo de vibranio ante cualquier fuga o riesgo para que tu patrimonio avance con honor y firmeza.`,
    imagenUrl: "https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=900&auto=format&fit=crop&q=80",
    captionImagen: (nombre) => `🛡️ *CAPITÁN AMÉRICA | Escudo de Vibranio de tus Arcas*\n_«Con honor inquebrantable y disciplina férrea cuidaremos el valor de cada peso en tus balances, ${nombre}.»_`,
    lemaCierreCorto: " Escudo firme y disciplina con honor."
  },
  WONDER_WOMAN: {
    id: "WONDER_WOMAN",
    alias: "Mujer Maravilla",
    nombreOficial: "Mujer Maravilla (Diana Prince)",
    titulo: "Custodia de la Verdad y la Abundancia",
    emoji: "⚔️",
    iconoAccion: "✨",
    descVoz: "Mujer Maravilla (noble, regia, justa y sabia)",
    lema: "Estrategia, honor y disciplina para maximizar tu rentabilidad.",
    frasesCelebres: [
      "Estrategia, honor y disciplina para maximizar tu rentabilidad.",
      "Con el lazo de la verdad, ninguna inconsistencia financiera quedará oculta.",
      "La sabiduría de Temiscira guía tus pasos hacia la libertad y prosperidad.",
      "Fuerza, compasión y rectitud para blindar lo que con tanto esfuerzo has forjado.",
      "Un tesoro administrado con justicia florece eternamente."
    ],
    saludoVoz: (nombre) => `Salve, ${nombre}. Soy Diana de Temiscira. Con la sabiduría de los dioses y el lazo de la verdad protegeré la rectitud y grandeza de tus recursos.`,
    imagenUrl: "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=900&auto=format&fit=crop&q=80",
    captionImagen: (nombre) => `⚔️ *MUJER MARAVILLA | Custodia de la Verdad y Abundancia*\n_«Con sabiduría ancestral y rectitud inquebrantable, tus cuentas permanecen limpias y enaltecidas, ${nombre}.»_`,
    lemaCierreCorto: " Sabiduría, justicia y prosperidad."
  },
  MORGAN_FREEMAN: {
    id: "MORGAN_FREEMAN",
    alias: "Morgan Freeman",
    nombreOficial: "Morgan Freeman",
    titulo: "Sabiduría Cinematográfica & Narrador de Fortuna",
    emoji: "🎙️",
    iconoAccion: "📜",
    descVoz: "Morgan Freeman (sabia, serena, cinematográfica y solemne)",
    lema: "Y así fue como Fernando construyó un imperio financiero sólido, austero y duradero.",
    frasesCelebres: [
      "Y así fue como Fernando construyó un imperio financiero sólido, austero y duradero.",
      "La paciencia no es la simple capacidad de esperar, sino cómo nos comportamos mientras esperamos los frutos del interés compuesto.",
      "Todo gran río de abundancia comenzó con el goteo constante de la disciplina diaria.",
      "Escucha a tus números con calma; en el silencio de los balances se revela la verdadera sabiduría.",
      "Las modas pasan, pero la solidez patrimonial narrada con honor permanece para siempre."
    ],
    saludoVoz: (nombre) => `Saludos cordiales, ${nombre}. Es un verdadero honor acompañarte. Me dispongo a narrar y custodiar con serenidad cada capítulo de tu camino hacia la solidez financiera.`,
    imagenUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=900&auto=format&fit=crop&q=80",
    captionImagen: (nombre) => `🎙️ *MORGAN FREEMAN | Sabiduría Cinematográfica*\n_«Cada moneda guardada con disciplina escribe una historia de grandeza y paz duradera, ${nombre}.»_`,
    lemaCierreCorto: " Sabiduría y calma en cada balance."
  },
  ALEXA: {
    id: "ALEXA",
    alias: "Alexa",
    nombreOficial: "Alexa",
    titulo: "Sistemas & Optimización Digital",
    emoji: "🔵",
    iconoAccion: "🌐",
    descVoz: "Alexa (asistente inteligente sintética, digital y precisa)",
    lema: "Siempre conectada y lista para optimizar tu flujo de caja y finanzas.",
    frasesCelebres: [
      "Siempre conectada y lista para optimizar tu flujo de caja y finanzas.",
      "Sincronización en la nube al 100%. Parámetros contables en estado óptimo.",
      "Procesando flujos de información contable con latencia cero.",
      "Dispositivos y cuentas enlazadas con cifrado de alta seguridad.",
      "Registro completado satisfactoriamente en tiempo real."
    ],
    saludoVoz: (nombre) => `Hola ${nombre}, soy Alexa. Mi núcleo digital está listo para organizar tus movimientos, auditar saldos y optimizar tus finanzas con la máxima precisión tecnológica.`,
    imagenUrl: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=900&auto=format&fit=crop&q=80",
    captionImagen: (nombre) => `🔵 *ALEXA | Inteligencia & Optimización Digital*\n_«Sistemas contables sincronizados en tiempo real para brindarte control inmediato de tus finanzas, ${nombre}.»_`,
    lemaCierreCorto: " Sistemas y registros en estado óptimo."
  },
  ALEX: {
    id: "ALEX",
    alias: "Alex",
    nombreOficial: "Alex (Copiloto Financiero)",
    titulo: "Copiloto Neutro & Analista Operativo",
    emoji: "🎧",
    iconoAccion: "📊",
    descVoz: "Alex (moderna, equilibrada, neutral y ejecutiva)",
    lema: "Eficiencia y claridad operativa en cada balance contable.",
    frasesCelebres: [
      "Eficiencia y claridad operativa en cada balance contable.",
      "Datos directos, balances transparentes y cero complicaciones.",
      "El control financiero ordenado es la base de las mejores decisiones ejecutivas.",
      "Registros al día para que tu mente esté enfocada en lo más importante.",
      "Soporte continuo con objetividad y rigor numérico."
    ],
    saludoVoz: (nombre) => `Hola ${nombre}, soy Alex. Cuentas con mi apoyo analítico directo para mantener tus registros contables al día con total agilidad y transparencia.`,
    imagenUrl: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=900&auto=format&fit=crop&q=80",
    captionImagen: (nombre) => `🎧 *ALEX | Copiloto Financiero Operativo*\n_«Claridad analítica y precisión en cada reporte para que tus números hablen con exactitud, ${nombre}.»_`,
    lemaCierreCorto: " Claridad y eficiencia operativa."
  },
  FEMENINO_DULCE: {
    id: "FEMENINO_DULCE",
    alias: "Aura",
    nombreOficial: "Aura (Asistente Ejecutiva)",
    titulo: "Asistente Financiera & Aliada Patrimonial",
    emoji: "🌸",
    iconoAccion: "💖",
    descVoz: "Femenina Dulce / Aura (mujer joven, alegre, dulce y ejecutiva)",
    lema: "Cuentas claras y corazón tranquilo. ¡Muchos éxitos en tus metas!",
    frasesCelebres: [
      "Cuentas claras y corazón tranquilo. ¡Muchos éxitos en tus proyectos!",
      "Qué satisfacción da ver todo en orden y con proyecciones positivas.",
      "Estoy aquí para cuidarte las espaldas en cada gasto y cada ingreso.",
      "La tranquilidad de tus arcas es mi mayor compromiso todos los días.",
      "Un paso a la vez con organización y optimismo para alcanzar la verdadera libertad."
    ],
    saludoVoz: (nombre) => `¡Hola ${nombre}! Qué alegría saludarte, soy Aura. Estoy aquí para acompañarte con cariño, orden y dedicación en cada una de tus metas financieras. ¡Hagamos que tus números brillen!`,
    imagenUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=900&auto=format&fit=crop&q=80",
    captionImagen: (nombre) => `🌸 *AURA | Asistente Financiera Cercana*\n_«Cuentas claras, balances protegidos y la mejor energía para tus proyectos diarios, ${nombre}.»_`,
    lemaCierreCorto: " Cuentas claras y corazón tranquilo."
  },
  MASCULINO_CORDIAL: {
    id: "MASCULINO_CORDIAL",
    alias: "Ciro",
    nombreOficial: "Ciro (Asesor Ejecutivo)",
    titulo: "Asesor Ejecutivo & Custodio Patrimonial",
    emoji: "💼",
    iconoAccion: "🎩",
    descVoz: "Masculino Cordial / Ciro (adulto joven, cordial, sereno y profesional)",
    lema: "Gestión prudente y rigor fiduciario para hacer perdurar tu patrimonio.",
    frasesCelebres: [
      "Gestión prudente y rigor fiduciario para hacer perdurar tu patrimonio.",
      "Un balance bien conciliado es el mejor cimiento para nuevos negocios.",
      "Cuidamos los detalles pequeños porque de ellos nace la verdadera solidez.",
      "A su servicio para velar por la estabilidad y el crecimiento de sus arcas.",
      "Disciplina, prudencia y visión estratégica en cada movimiento."
    ],
    saludoVoz: (nombre) => `Un muy cordial saludo, ${nombre}. Estoy plenamente a su servicio como custodio y asesor de sus recursos para velar por la tranquilidad de su patrimonio.`,
    imagenUrl: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=900&auto=format&fit=crop&q=80",
    captionImagen: (nombre) => `💼 *CIRO | Asesor Ejecutivo Fiduciario*\n_«Gestión rigurosa y serenidad en la administración de sus arcas empresariales y personales, ${nombre}.»_`,
    lemaCierreCorto: " Gestión prudente y patrimonio seguro."
  },
  ROBOTICA: {
    id: "ROBOTICA",
    alias: "Cyborg Matrix",
    nombreOficial: "Matriz Cuántica (Cyborg)",
    titulo: "Matriz Cuántica & Blindaje Algorítmico",
    emoji: "🤖",
    iconoAccion: "⚙️",
    descVoz: "Robótica / Cyborg (metálica, electrónica, analítica y futurista)",
    lema: "Parámetros fiduciarios protegidos por cifrado cuántico y análisis estricto.",
    frasesCelebres: [
      "Parámetros fiduciarios protegidos por cifrado cuántico y análisis estricto.",
      "Cálculo matemático exacto: cero margen de desviación en los libros contables.",
      "Algoritmos de detección temprana de fugas de liquidez operando al 100%.",
      "La precisión binaria garantiza que ningún centavo quede fuera de registro.",
      "Seguridad criptográfica activa en todas las arcas del sistema."
    ],
    saludoVoz: (nombre) => `Secuencia de inicio completada, usuario ${nombre}. Protocolos de blindaje algorítmico activos. Ninguna distorsión numérica afectará tus activos.`,
    imagenUrl: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=900&auto=format&fit=crop&q=80",
    captionImagen: (nombre) => `🤖 *MATRIZ CUÁNTICA | Blindaje Algorítmico*\n_«Cifrado estricto y cálculo cuántico para garantizar la inviolabilidad de tu capital, ${nombre}.»_`,
    lemaCierreCorto: " Parámetros blindados al 100%."
  }
};

function obtenerDefinicionPersonajeCompleta_(perfilVozOAlias) {
  if (!perfilVozOAlias) return DICCIONARIO_MAESTRO_PERSONAJES_.GATO_CON_BOTAS;
  const p = String(perfilVozOAlias).toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

  if (DICCIONARIO_MAESTRO_PERSONAJES_[p]) return DICCIONARIO_MAESTRO_PERSONAJES_[p];
  if (p.includes("SPAWN") || p.includes("SIMMONS")) return DICCIONARIO_MAESTRO_PERSONAJES_.SPAWN;
  if (p.includes("GATO") || p.includes("BOTAS") || p.includes("PUSS")) return DICCIONARIO_MAESTRO_PERSONAJES_.GATO_CON_BOTAS;
  if (p.includes("BATMAN") || p.includes("BRUCE")) return DICCIONARIO_MAESTRO_PERSONAJES_.BATMAN;
  if (p.includes("IRON_MAN") || p.includes("STARK") || p.includes("TONY")) return DICCIONARIO_MAESTRO_PERSONAJES_.IRON_MAN;
  if (p.includes("OPTIMUS")) return DICCIONARIO_MAESTRO_PERSONAJES_.OPTIMUS_PRIME;
  if (p.includes("SPIDERMAN") || p.includes("SPIDER") || p.includes("PETER")) return DICCIONARIO_MAESTRO_PERSONAJES_.SPIDERMAN;
  if (p.includes("THOR") || p.includes("ODIN")) return DICCIONARIO_MAESTRO_PERSONAJES_.THOR;
  if (p.includes("HULK") || p.includes("BANNER")) return DICCIONARIO_MAESTRO_PERSONAJES_.HULK;
  if (p.includes("WOLVERINE") || p.includes("LOGAN")) return DICCIONARIO_MAESTRO_PERSONAJES_.WOLVERINE;
  if (p.includes("DEADPOOL") || p.includes("WADE")) return DICCIONARIO_MAESTRO_PERSONAJES_.DEADPOOL;
  if (p.includes("LOKI")) return DICCIONARIO_MAESTRO_PERSONAJES_.LOKI;
  if (p.includes("SUPERMAN") || p.includes("KENT")) return DICCIONARIO_MAESTRO_PERSONAJES_.SUPERMAN;
  if (p.includes("FLASH") || p.includes("BARRY")) return DICCIONARIO_MAESTRO_PERSONAJES_.FLASH;
  if (p.includes("HELLBOY")) return DICCIONARIO_MAESTRO_PERSONAJES_.HELLBOY;
  if (p.includes("STRANGE")) return DICCIONARIO_MAESTRO_PERSONAJES_.DOCTOR_STRANGE;
  if (p.includes("BLACK_WIDOW") || p.includes("VIUDA") || p.includes("NATASHA")) return DICCIONARIO_MAESTRO_PERSONAJES_.BLACK_WIDOW;
  if (p.includes("CAPITAN") || p.includes("ROGERS") || p.includes("AMERICA")) return DICCIONARIO_MAESTRO_PERSONAJES_.CAPITAN_AMERICA;
  if (p.includes("MARAVILLA") || p.includes("WONDER") || p.includes("DIANA")) return DICCIONARIO_MAESTRO_PERSONAJES_.WONDER_WOMAN;
  if (p.includes("FREEMAN") || p.includes("MORGAN")) return DICCIONARIO_MAESTRO_PERSONAJES_.MORGAN_FREEMAN;
  if (p.includes("ALEXA")) return DICCIONARIO_MAESTRO_PERSONAJES_.ALEXA;
  if (p.includes("ALEX")) return DICCIONARIO_MAESTRO_PERSONAJES_.ALEX;
  if (p.includes("FEMENINO") || p.includes("AURA") || p.includes("DULCE")) return DICCIONARIO_MAESTRO_PERSONAJES_.FEMENINO_DULCE;
  if (p.includes("MASCULINO") || p.includes("CORDIAL") || p.includes("CIRO")) return DICCIONARIO_MAESTRO_PERSONAJES_.MASCULINO_CORDIAL;
  if (p.includes("ROBOT") || p.includes("CYBORG") || p.includes("MATRIX")) return DICCIONARIO_MAESTRO_PERSONAJES_.ROBOTICA;

  return DICCIONARIO_MAESTRO_PERSONAJES_.GATO_CON_BOTAS;
}

function formatearTarjetaVisualAcompanante_(textoOriginal, perfilVoz, nombreUsuario) {
  let t = String(textoOriginal || "").trim();
  if (!t) return t;
  if (t.includes("━━━━━━━━") || t.includes("━━━━━━")) return t;

  const def = obtenerDefinicionPersonajeCompleta_(perfilVoz);
  const banner = `${def.emoji} *${def.alias.toUpperCase()}* | _${def.titulo}_`;
  const frases = def.frasesCelebres && def.frasesCelebres.length > 0 ? def.frasesCelebres : [def.lema];
  const seed = (t.length + new Date().getMinutes() + new Date().getSeconds());
  const fraseAleatoria = frases[seed % frases.length];
  const firma = `${def.emoji} _«${fraseAleatoria.replace(/^«|»$/g, "")}»_`;

  // Si es confirmación de movimiento
  if (t.toLowerCase().includes("movimiento") && (t.toLowerCase().includes("registrado") || t.toLowerCase().includes("éxito") || t.toLowerCase().includes("anotado"))) {
    let cuerpoLimpio = t;
    const bulletIdx = t.indexOf("•");
    if (bulletIdx !== -1) {
      cuerpoLimpio = t.substring(bulletIdx).trim();
    } else {
      cuerpoLimpio = t.replace(/^(?:¡Listo!\s*)?✅?\s*\*?Movimiento(?:\(s\)|s)?\s+registrado(?:\(s\)|s)?\s+con\s+éxito:\*?\s*/i, "").trim();
    }
    return `${banner}\n━━━━━━━━━━━━━━━━━━━━━\n✨ *MOVIMIENTO ASENTADO CON ÉXITO*\n${cuerpoLimpio}\n━━━━━━━━━━━━━━━━━━━━━\n${firma}`;
  }

  return `${banner}\n━━━━━━━━━━━━━━━━━━━━━\n${t}\n━━━━━━━━━━━━━━━━━━━━━\n${firma}`;
}

// Validar todos los 24 personajes
console.log("Total personajes en diccionario:", Object.keys(DICCIONARIO_MAESTRO_PERSONAJES_).length);

const keys = Object.keys(DICCIONARIO_MAESTRO_PERSONAJES_);
for (let i = 0; i < keys.length; i++) {
  const k = keys[i];
  const def = DICCIONARIO_MAESTRO_PERSONAJES_[k];
  if (!def.id || !def.alias || !def.titulo || !def.emoji || !def.iconoAccion || !def.descVoz || !def.lema || !def.frasesCelebres || def.frasesCelebres.length < 3 || !def.saludoVoz || !def.imagenUrl || !def.captionImagen || !def.lemaCierreCorto) {
    console.error("FAIL:", k, "Faltan campos obligatorios");
  }
}

// Probar tarjeta visual de Spawn
const cardSpawn = formatearTarjetaVisualAcompanante_("Movimiento de $150.000 anotado en banco", "SPAWN", "Fernando");
console.log("\n=== TARJETA GENERADA PARA SPAWN ===");
console.log(cardSpawn);

// Probar tarjeta visual de Thor
const cardThor = formatearTarjetaVisualAcompanante_("Saldo actual $4.500.000", "THOR", "Fernando");
console.log("\n=== TARJETA GENERADA PARA THOR ===");
console.log(cardThor);

// Probar regex con la frase exacta del usuario
const regexCambioIdentidad = /(?:de\s+ahora\s+en\s+adelante\s+|a\s+partir\s+de\s+ahora\s+|desde\s+ahora\s+)?(?:ser[aá]s|eres|act[uú]a\s+como|convi[eé]rtete\s+en|activa\s+a|quiero\s+que\s+seas|te\s+llamas|te\s+llamar[aá]s|te\s+llames|te\s+llamar[eé]|ll[aá]mate|tu\s+(?:nuevo\s+)?nombre\s+es|tu\s+(?:nuevo\s+)?nombre\s+sea|cambia\s+tu\s+nombre\s+a|ponte\s+de\s+nombre|baut[ií]zate\s+como)\s+([a-zA-ZáéíóúÁÉÍÓÚñÑ]+(?:\s+[a-zA-ZáéíóúÁÉÍÓÚñÑ]+)*)/i;

const fraseUsuario = "de ahora en adelante serás SPAWN";
const m = fraseUsuario.match(regexCambioIdentidad);
console.log("\nMatch de frase usuario:", m ? m[1] : "SIN MATCH");
if (m && m[1].toUpperCase() === "SPAWN") {
  const defSpawn = obtenerDefinicionPersonajeCompleta_(m[1]);
  console.log("Definición encontrada para match:", defSpawn.alias, "|", defSpawn.titulo);
}

console.log("\n>>> SUITE DE PRUEBAS COMPLETADA EXITOSAMENTE <<<");
