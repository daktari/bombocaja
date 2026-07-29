# bakaluti 🥁

Antes «bombocaja». Un mini-playground web para aprender a hacer ritmos escribiendo texto.
Inspirado en Strudel / TidalCycles, pero radicalmente simplificado para
gente sin ningún conocimiento musical.

## Correr (solo necesitas Docker)

```bash
docker compose up --build          # desarrollo con hot reload
```

Abre http://localhost:5173

## Producción

```bash
docker compose --profile prod up --build prod   # build + nginx
```

Abre http://localhost:8880. El build es una SPA estática (`npm run build` →
`dist/`), así que también puedes desplegarla gratis en Cloudflare Pages o
Netlify: build command `npm run build`, output `dist`. Al desplegar,
actualiza `og:image` en `index.html` con la URL absoluta de tu dominio
(los scrapers de WhatsApp/Twitter no siguen rutas relativas).

Los sonidos base y los 3 kits van **self-hosted** en `public/samples/`
(~2,6 MB): la app suena aunque GitHub no responda; las variantes extra
siguen llegando de los repos de Strudel.

## El lenguaje (todo el lenguaje)

| token | sonido            |
| ----- | ----------------- |
| `bd`  | golpe profundo    |
| `sn`  | golpe seco        |
| `hh`  | brillo corto      |
| `ho`  | brillo largo      |
| `cp`  | palmada           |
| `rm`  | toque de madera   |
| `cb`  | campana           |
| `lt`  | tambor grave      |
| `mt`  | tambor medio      |
| `ht`  | tambor agudo      |
| `~`   | silencio          |

- Sonidos separados por espacios.
- `bd:3` = variante 3 del bombo (cada sonido tiene varias versiones).
- Cada línea es una capa; todas suenan a la vez en bucle.
- Líneas que empiezan con `--` son comentarios.
- Tempo ajustable (60–180 BPM) y volumen general + por línea.

### Mini-notación

| sintaxis  | qué hace                                    |
| --------- | ------------------------------------------- |
| `[bd bd]` | dos golpes en el espacio de un paso         |
| `bd*2`    | lo mismo, escrito más corto                 |
| `<bd sn>` | alterna: una vuelta bd, la siguiente sn     |
| `bd(3,8)` | ritmo euclidiano: 3 golpes repartidos en 8  |
| `hh?`     | suena solo a veces (50%)                    |

Se pueden combinar y anidar: `[bd hh]*2`, `<bd [sn sn]>?`…

### Trucos con `|`

Al final de una línea, separados por `|`:

| comando        | qué hace                              |
| -------------- | ------------------------------------- |
| `\| fast 2`    | la línea va el doble de rápido        |
| `\| slow 2`    | la mitad de lento                     |
| `\| rev`       | los pasos del revés                   |
| `\| every 4 rev` | cada 4 vueltas suena del revés      |
| `\| lpf 800`   | filtro: apaga los agudos (100–12000)  |
| `\| delay 0.3` | eco (0–1)                             |
| `\| reverb 0.4`| espacio (0–1)                         |
| `\| pan -1`    | izquierda ↔ derecha (-1 a 1)          |
| `\| gain 0.5`  | volumen de la línea (0–2)             |

```
bd ~ sn ~ | every 4 rev
hh hh hh hh | fast 2 | lpf 900
cp ~ ~ cp | delay 0.5 | pan 0.4
```

### Cajas de ritmos

`| kit 808` (Roland TR-808), `| kit 909` (TR-909) o `| kit linn` (LinnDrum):
mismo patrón, máquina legendaria sampleada de verdad. También se acepta la
forma de Strudel: `| bank RolandTR808`. Y los alias de sonidos de Strudel
(`sd`, `oh`, `rim`) valen igual que los nuestros (`sn`, `ho`, `rm`).

```
bd ~ sn ~ | kit 808
hh*2 hh hh*2 hh | kit 909
```

### Tu voz (v1…v8)

Graba hasta 8 sonidos con el micro (fila **VOZ** del Editor) y úsalos como
tokens: `v1 ~ v1 v2 | reverb 0.5`. Se combinan con toda la mini-notación y
persisten en tu navegador (IndexedDB). El export a WAV los incluye.

### Modo AUTO

El botón **⟳ AUTO** hace que la app mute el ritmo sola cada 4 vueltas
(cambia un sonido, añade un `?`, dobla un golpe…). Fija con ▣ las líneas
que te gusten y deja evolucionar el resto. Aprende viendo a la máquina
live-codear.

### Groove

`| swing 0.3` arrastra los pasos pares (el groove del hip-hop/house),
`| drive 0.5` añade distorsión, y el hat cerrado corta al abierto como en
una batería real.

### Melodía

- Notas: `c d e f g a b` (do–si), `c5` = más aguda, `c#` = sostenido.
- Peldaños: `0 2 4 7` — números sobre una escala; imposible desafinar.
- `| synth piano` (o `bass`, `pad`) elige el instrumento.
- `| scale menor` (o `mayor`, `penta`) elige la escala de los peldaños.

```
c e g <c5 b> | synth piano
0 0 3 5 | synth bass | scale menor
bd ~ sn ~
```

La mini-notación completa funciona también con notas: `[c e] g`, `<c e>?`…

### Editor

CodeMirror con resaltado de sintaxis y autocompletado, y **el código baila**:
cada token se ilumina justo cuando suena. `Ctrl/⌘+Enter` = Play ·
`Ctrl/⌘+.` = Stop. El fondo del editor es un espectro que reacciona al audio.

### Exportar

Botón 🔴 Exportar: graba 4 vueltas del patrón (render offline, sin ruido)
y descarga un `.wav` listo para compartir donde quieras.

```
-- drums
bd ~ sn ~

-- hats
hh hh ho hh
```

## Sonidos

Los samples reales vienen de [Dirt-Samples](https://github.com/tidalcycles/Dirt-Samples)
(la misma librería que usa Strudel) y se descargan del navegador la primera
vez que se usan. Sin conexión, `bd` / `sn` / `hh` suenan con versiones
sintetizadas de respaldo.

## Aprender, guardar y compartir

- **Learn**: curso de 10 lecciones progresivas (de "tu primer ritmo" a melodía
  con escalas). El progreso se guarda en tu navegador.
- **Guardar**: botón 💾 en el Editor → tus ritmos aparecen en Library.
- **Compartir**: botón 🔗 copia un enlace con el ritmo codificado en la URL —
  quien lo abra lo verá cargado en su editor. Sin servidor, sin cuentas.

## Idioma, móvil y offline

- Interfaz y curso completos en **español e inglés** — toggle `es→en` arriba
  a la derecha.
- **Responsive**: en pantallas pequeñas los paneles laterales se abren como
  drawers y el índice de lecciones se convierte en una tira horizontal.
- **PWA**: instalable, con service worker que cachea la app y los samples ya
  descargados (funciona sin conexión tras la primera visita; el SW solo se
  activa en el build de producción).

## Para IAs (vibe coding)

El lenguaje es inventado, así que los LLMs no lo conocen de serie. La
especificación completa vive en [`/llms.txt`](public/llms.txt) — en
producción: `https://bakaluti.com/llms.txt`. Pásasela a Claude Code,
Cursor o cualquier modelo como contexto y generará patrones válidos.

## Créditos y licencia

- Los samples vienen de [Dirt-Samples](https://github.com/tidalcycles/Dirt-Samples)
  y [tidal-drum-machines](https://github.com/ritchse/tidal-drum-machines), las
  librerías comunitarias del ecosistema [TidalCycles](https://tidalcycles.org).
- Inspirada en [Strudel](https://strudel.cc) y TidalCycles, referentes del
  live coding. La mini-notación es compatible con la suya a propósito.
- **Privacidad**: sin cuentas, ni cookies, ni servidores. Ritmos, progreso y
  grabaciones de voz viven solo en tu navegador.
- Código bajo licencia [AGPL-3.0](LICENSE).

## Limitaciones del POC

- Los ritmos se guardan en localStorage (solo en este navegador).
- Los sonidos que no sean bd/sn/hh necesitan internet la primera vez.
- No hay export a audio ni MIDI.
