// Test script to verify the new multi-character engine
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
    descVoz: "Batman / Bruce Wayne (grave, profunda, solemne e imponente)",
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
  }
};

function obtenerDefinicionPersonajeCompleta_(perfilVozOAlias) {
  if (!perfilVozOAlias) return DICCIONARIO_MAESTRO_PERSONAJES_.GATO_CON_BOTAS;
  const p = String(perfilVozOAlias).toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

  if (DICCIONARIO_MAESTRO_PERSONAJES_[p]) return DICCIONARIO_MAESTRO_PERSONAJES_[p];
  if (p.includes("SPAWN") || p.includes("SIMMONS")) return DICCIONARIO_MAESTRO_PERSONAJES_.SPAWN;
  if (p.includes("BATMAN") || p.includes("BRUCE")) return DICCIONARIO_MAESTRO_PERSONAJES_.BATMAN;
  if (p.includes("GATO") || p.includes("BOTAS")) return DICCIONARIO_MAESTRO_PERSONAJES_.GATO_CON_BOTAS;
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

  return `${banner}\n━━━━━━━━━━━━━━━━━━━━━\n${t}\n━━━━━━━━━━━━━━━━━━━━━\n${firma}`;
}

const cardSpawn = formatearTarjetaVisualAcompanante_("Movimiento registrado con éxito", "SPAWN", "Fernando");
console.log("--- TARJETA SPAWN ---");
console.log(cardSpawn);

const regexCambioIdentidad = /(?:de\s+ahora\s+en\s+adelante\s+|a\s+partir\s+de\s+ahora\s+|desde\s+ahora\s+)?(?:ser[aá]s|eres|act[uú]a\s+como|convi[eé]rtete\s+en|activa\s+a|quiero\s+que\s+seas|te\s+llamas|te\s+llamar[aá]s|te\s+llames|te\s+llamar[eé]|ll[aá]mate|tu\s+(?:nuevo\s+)?nombre\s+es|tu\s+(?:nuevo\s+)?nombre\s+sea|cambia\s+tu\s+nombre\s+a|ponte\s+de\s+nombre|baut[ií]zate\s+como)\s+([a-zA-ZáéíóúÁÉÍÓÚñÑ]+(?:\s+[a-zA-ZáéíóúÁÉÍÓÚñÑ]+)*)/i;

const testInput = "de ahora en adelante serás SPAWN";
const match = testInput.match(regexCambioIdentidad);
console.log("\n--- TEST REGEX ---");
console.log("Match:", match ? match[1] : "NO MATCH");
