import { ArrowDown, ArrowElbow, ArrowRight, Box, Diagram, Label, Zone, diagramStyles as s } from "./parts";

/* =============================================================================
   THE DIAGRAMS
   =============================================================================

   One per idea that a paragraph explains worse than a picture. That test is
   the whole editorial rule here: if the prose beside a diagram already carries
   it, the diagram is decoration and should be deleted rather than kept because
   it looks considered.

   Each is a pure function of nothing. No props, no state, no measurement —
   which means they can be moved, reordered or dropped without anything else
   having to know.
   ========================================================================== */

/* ---------------------------------------------------------------------------
   1. WHO OWNS WHAT
   -----------------------------------------------------------------------------
   The single most important boundary in the system, and the one a reader has
   to hold for the rest of the document: YouTube owns the media, Neko Dancer
   owns everything about the game, and the join between them is one id.
   ------------------------------------------------------------------------ */

export function OwnershipDiagram() {
  return (
    <Diagram
      viewBox="0 0 640 300"
      title="What YouTube owns and what Neko Dancer owns"
      desc="YouTube holds the video and the playback clock. Neko Dancer holds a song record that references the video by id, and each song record has many charts at different difficulties. The only thing crossing the boundary is the video id."
    >
      <Zone x={14} y={30} w={200} h={90} label="YouTube" />
      <Box x={34} y={52} w={160} h={46} label="Video" sub="audio, and the clock" />

      <Zone x={266} y={30} w={360} h={244} label="Neko Dancer" />
      <Box x={300} y={52} w={200} h={46} label="Song" sub="title, artist, videoId" lead />

      {/* The join. Labelled ON the arrow, because "one id and nothing else" is
          the claim the whole diagram exists to make. */}
      <ArrowRight x1={196} x2={298} y={75} />
      <Label x={247} y={66} anchor="middle" tone="faint" mono>
        videoId
      </Label>

      <Box x={340} y={140} w={140} h={36} label="Chart — Easy" />
      <Box x={340} y={186} w={140} h={36} label="Chart — Normal" />
      <Box x={340} y={232} w={140} h={36} label="Chart — Hard" />

      {/* One parent, three children: drawn as a spine with three elbows rather
          than three separate arrows, so the "many" is visible as a shape.

          THE SPINE DROPS TO THE LEFT OF THE CHART BOXES (316 against their 340)
          so each elbow finishes travelling RIGHTWARD and its head points into
          the box it names. Dropping it on the boxes' own left edge points every
          head back out of the diagram — correct-looking at a glance and
          backwards, which is worse than obviously broken. */}
      <ArrowElbow x1={316} y1={98} x2={340} y2={158} />
      <ArrowElbow x1={316} y1={98} x2={340} y2={204} />
      <ArrowElbow x1={316} y1={98} x2={340} y2={250} />

      <Label x={500} y={196} tone="faint">
        each by an author,
      </Label>
      <Label x={500} y={212} tone="faint">
        each its own note data
      </Label>

      <Label x={14} y={166} tone="quiet">
        No audio is downloaded, stored
      </Label>
      <Label x={14} y={184} tone="quiet">
        or served. Every client loads
      </Label>
      <Label x={14} y={202} tone="quiet">
        the same video itself.
      </Label>
    </Diagram>
  );
}

/* ---------------------------------------------------------------------------
   2. WHY BPM IS NOT A CHART
   -----------------------------------------------------------------------------
   The argument is comparative and therefore visual: an even grid above, the
   actual notes below, and the places they disagree are the entire point.
   ------------------------------------------------------------------------ */

export function TimingDiagram() {
  const left = 60;
  const right = 610;
  /* A regular grid at a fixed spacing — what BPM alone would give you. */
  const beats = Array.from({ length: 12 }, (_, i) => left + i * 50);
  /* The same passage as actually played: a pickup before beat one, two notes
     off the grid, a rest, and a tempo that has moved by the end. */
  const notes = [72, 110, 160, 186, 210, 260, 310, 336, 408, 452, 494, 530, 562];

  return (
    <Diagram
      viewBox="0 0 640 200"
      title="An even beat grid compared with the notes actually played"
      desc="The upper line is an evenly spaced grid derived from BPM. The lower line is the notes of the same passage: some land on the grid, some fall between beats, one section is silent, and the spacing changes toward the end. The grid cannot describe the notes."
    >
      <Label x={0} y={44} tone="quiet">
        BPM grid
      </Label>
      <line className={s.line} x1={left} y1={54} x2={right} y2={54} />
      {beats.map((x) => (
        <line key={x} className={s.tick} x1={x} y1={44} x2={x} y2={64} />
      ))}
      <Label x={left} y={82} tone="faint">
        evenly spaced, forever
      </Label>

      <Label x={0} y={134} tone="quiet">
        The music
      </Label>
      <line className={s.line} x1={left} y1={144} x2={right} y2={144} />
      {notes.map((x) => (
        <circle key={x} className={s.note} cx={x} cy={144} r={3.5} />
      ))}
      {/* The gap is as much a part of the argument as the notes are. */}
      <line className={s.lineSoft} x1={340} y1={144} x2={404} y2={144} />
      <Label x={372} y={132} anchor="middle" tone="faint">
        rest
      </Label>
      <Label x={left} y={172} tone="faint">
        pickup, syncopation, a rest, and the tempo moves
      </Label>
    </Diagram>
  );
}

/* ---------------------------------------------------------------------------
   3. THE INPUT PATH
   -----------------------------------------------------------------------------
   Two loops of very different length, drawn at very different lengths. The
   diagram is making a claim about LATENCY, so the geometry has to be honest
   about it or the picture argues against the paragraph.
   ------------------------------------------------------------------------ */

export function InputPathDiagram() {
  return (
    <Diagram
      viewBox="0 0 640 240"
      title="What a keypress touches before the player sees anything"
      desc="A keypress goes to the local game, which judges it and draws the result immediately. Separately and afterwards, a summary of what happened is sent over the network to the other players. Nothing on the network sits between the key and the feedback."
    >
      <Box x={12} y={72} w={110} h={44} label="Keypress" />
      <ArrowRight x1={124} x2={196} y={94} />
      <Box x={198} y={64} w={150} h={60} label="Local game" sub="judge · score · draw" lead />

      {/* The fast loop, returned to the player. Short by construction. */}
      <ArrowElbow x1={273} y1={124} x2={273} y2={168} />
      <Box x={198} y={168} w={150} h={40} label="What you see" />
      <Label x={362} y={186} tone="quiet">
        immediate — nothing else is asked
      </Label>

      {/* The slow path, sideways and dashed: it happens, and nothing waits on
          it. Dashes are this page's mark for "weaker or not yet built". */}
      <ArrowRight x1={350} x2={438} y={94} soft />
      <Box x={440} y={64} w={186} h={60} label="Other players" sub="a summary, over the socket" ghost />
      <Label x={352} y={44} tone="faint">
        after the fact
      </Label>

      <Zone x={190} y={52} w={168} h={168} label="On this machine" />
    </Diagram>
  );
}

/* ---------------------------------------------------------------------------
   4. KEYS TO LANES
   -----------------------------------------------------------------------------
   Small, and it earns its place because the claim is exactly a mapping: two
   sets of keys, one set of lanes, and the conversion happening before anything
   is stored or judged.
   ------------------------------------------------------------------------ */

export function LaneDiagram() {
  const lanes = ["left", "down", "up", "right"] as const;
  /* Paired with `lanes` by position and typed as fixed-length tuples, so an
     added lane without an added key pair is a compile error rather than a
     diagram with a hole in it. */
  const keys: readonly (readonly [string, string])[] = [
    ["←", "A"],
    ["↓", "S"],
    ["↑", "W"],
    ["→", "D"],
  ];

  return (
    <Diagram
      viewBox="0 0 640 190"
      title="Both key sets map to the same four lanes"
      desc="Arrow keys and WASD each map onto the four lanes left, down, up and right. The mapping happens in the input layer, so everything stored or judged downstream refers only to a lane, never to a key."
    >
      {lanes.map((lane, i) => {
        const x = 40 + i * 150;
        const [arrow, letter] = keys[i] ?? ["", ""];
        const centre = x + 60;
        return (
          <g key={lane}>
            <Box x={x} y={16} w={54} h={34} label={arrow} />
            <Box x={x + 66} y={16} w={54} h={34} label={letter} />
            {/* Two plain diagonals CONVERGING on one arrowhead, rather than two
                elbows each with a head of its own. Both key boxes feed one
                lane, so the drawing should have one point of arrival — two
                heads read as two separate lanes that happen to sit together. */}
            <line className={s.line} x1={x + 27} y1={50} x2={centre} y2={98} />
            <line className={s.line} x1={x + 93} y1={50} x2={centre} y2={98} />
            <ArrowDown x={centre} y1={98} y2={110} />
            <Box x={x} y={110} w={120} h={38} label={lane} lead />
          </g>
        );
      })}
      {/* Labelled BELOW: the arrows cross this box's top edge, and a caption up
          there would have four lines drawn through it. */}
      <Zone
        x={12}
        y={100}
        w={616}
        h={58}
        label="What the game stores and judges"
        below
      />
    </Diagram>
  );
}

/* ---------------------------------------------------------------------------
   5. THE ROOM
   -----------------------------------------------------------------------------
   A state diagram, not an architecture one: what one room is holding at any
   moment, and which of it survives the room.
   ------------------------------------------------------------------------ */

export function RoomDiagram() {
  const held: readonly (readonly [string, string])[] = [
    ["Players", "who is here, and connected"],
    ["Chat", "the last N lines"],
    ["Queue", "songs waiting"],
    ["Current song", "and its chart"],
    ["Ready state", "per player"],
    ["Round state", "idle · preparing · playing"],
  ];

  return (
    <Diagram
      viewBox="0 0 640 300"
      title="What a room holds"
      desc="A room holds players, chat, a song queue, the current song, per-player ready state and the round state. All of it lives in memory on the server and disappears when the room does. Charts, users and scores live in the database and outlive every room."
    >
      <Zone x={12} y={30} w={400} h={244} label="In memory — dies with the room" />
      {/* The name INSIDE the box and its gloss in the margin beside it. Both
          inside would need a two-line box and turn a list of six into a wall;
          the gloss is support, and support sits outside the thing it supports.
          The box therefore stops well short of the zone's edge — the gap is not
          slack, it is the column the glosses live in. */}
      {held.map(([name, gloss], i) => (
        <g key={name}>
          <Box x={34} y={48 + i * 38} w={200} h={30} label={name} />
          <Label x={252} y={68 + i * 38} tone="faint">
            {gloss}
          </Label>
        </g>
      ))}

      <Zone x={444} y={30} w={184} h={244} label="In Postgres — outlives it" />
      {["Users", "Songs", "Charts", "Scores"].map((name, i) => (
        <Box key={name} x={466} y={64 + i * 48} w={140} h={34} label={name} lead />
      ))}
    </Diagram>
  );
}

/* ---------------------------------------------------------------------------
   6. STARTING A ROUND
   -----------------------------------------------------------------------------
   A sequence diagram, because the argument is about ORDER — specifically that
   the load happens before the countdown rather than during it.
   ------------------------------------------------------------------------ */

export function RoundStartDiagram() {
  const lanes = [
    { x: 100, label: "Player A" },
    { x: 320, label: "Server" },
    { x: 540, label: "Player B" },
  ];
  const top = 54;
  const bottom = 336;

  /* Each step is [fromLane, toLane, y, message]. Kept as data so the order can
     be changed by editing a list rather than by moving twenty coordinates. */
  const steps: [number, number, number, string][] = [
    [0, 1, 92, "READY"],
    [2, 1, 116, "READY"],
    [1, 0, 156, "PREPARE  chartId"],
    [1, 2, 180, "PREPARE  chartId"],
    [0, 1, 220, "PREPARED"],
    [2, 1, 244, "PREPARED"],
    [1, 0, 284, "START  in 3000ms"],
    [1, 2, 308, "START  in 3000ms"],
  ];

  return (
    <Diagram
      viewBox="0 0 640 380"
      title="The order a round starts in"
      desc="Both players send ready. The server sends prepare with the chart id. Each player loads the video and the chart and replies prepared. Only then does the server send start. Loading finishes before the countdown begins, so nobody starts mid-buffer."
    >
      {lanes.map((lane) => (
        <g key={lane.label}>
          <Label x={lane.x} y={30} anchor="middle" tone="bright">
            {lane.label}
          </Label>
          <line className={s.lineSoft} x1={lane.x} y1={top} x2={lane.x} y2={bottom} />
        </g>
      ))}

      {steps.map(([from, to, y, message]) => {
        const x1 = lanes[from]?.x ?? 0;
        const x2 = lanes[to]?.x ?? 0;
        return (
          <g key={`${message}-${y}`}>
            <ArrowRight x1={x1} x2={x2} y={y} />
            <Label x={(x1 + x2) / 2} y={y - 8} anchor="middle" tone="faint" mono>
              {message}
            </Label>
          </g>
        );
      })}

      {/* The band that is the whole point of the drawing. */}
      <rect className={s.zone} x={40} y={140} width={560} height={122} rx={3} />
      <Label x={44} y={134} tone="quiet">
        Loading happens here — before the countdown, not during it
      </Label>

      <Label x={320} y={368} anchor="middle" tone="faint">
        The server decides WHEN. Each player's own media clock decides WHERE.
      </Label>
    </Diagram>
  );
}

/* ---------------------------------------------------------------------------
   7. DRIFT
   -----------------------------------------------------------------------------
   Two lines and a band. The band is the decision the section is asking for,
   which is why it is drawn as an empty region rather than as a number.
   ------------------------------------------------------------------------ */

export function DriftDiagram() {
  /* The drawing stops at x=540 rather than at the viewBox edge, because the two
     lines are labelled where they END and a label needs somewhere to go. A
     diagram whose own captions are clipped by its viewBox is the most common
     way an SVG looks broken on a narrow screen. */
  const left = 70;
  const right = 540;
  const labelX = 552;

  return (
    <Diagram
      viewBox="0 0 640 220"
      title="Expected song position against actual song position"
      desc="A straight line shows where the song should be. A second line shows where one player's video actually is: it starts together, falls behind while it buffers, and never fully catches up. A tolerance band around the expected line marks how far apart the two may be before the room is told. Crossing it shows the player as drifted; it never moves anybody's video."
    >
      <Label x={0} y={26} tone="quiet">
        Song position
      </Label>

      {/* The band, drawn first so both lines sit on top of it, and drawn as a
          constant offset either side of the expected line so it reads as a
          TOLERANCE rather than as a third trajectory. */}
      <path
        className={s.zone}
        d={`M ${left} 164 L ${right} 52 L ${right} 80 L ${left} 192 Z`}
      />

      {/* Expected: straight, because expected time is linear by definition. */}
      <line className={s.lineStrong} x1={left} y1={178} x2={right} y2={66} />
      <Label x={labelX} y={62} tone="quiet">
        expected
      </Label>

      {/* Actual: together, then flat where the video stalled, then a recovery
          that never quite closes the gap it opened. */}
      <path
        className={s.line}
        d={`M ${left} 178 L 200 148 L 290 148 L 400 114 L ${right} 82`}
      />
      <Label x={labelX} y={86} tone="faint">
        actual
      </Label>
      <Label x={245} y={140} anchor="middle" tone="faint">
        buffering
      </Label>

      <Label x={left} y={210} tone="faint">
        {"Time →"}
      </Label>
      <Label x={340} y={210} anchor="middle" tone="quiet">
        Past the band, the room is told. The video is never moved.
      </Label>
    </Diagram>
  );
}

/* ---------------------------------------------------------------------------
   8. LOCAL FIRST
   -----------------------------------------------------------------------------
   The build order as a shape: a complete loop that works alone, with the
   multiplayer parts drawn around it as additions rather than as layers it sits
   inside.
   ------------------------------------------------------------------------ */

export function LocalFirstDiagram() {
  const loop = ["Pick a song", "Load the chart", "Load the video", "Play", "Score"];

  return (
    <Diagram
      viewBox="0 0 640 250"
      title="The single-player loop, and what multiplayer adds around it"
      desc="A complete single-player loop runs from picking a song through loading the chart and the video, playing, and scoring. Multiplayer adds a room, a queue, ready state, a synchronised start and shared results around that loop without replacing any part of it."
    >
      {loop.map((step, i) => {
        const x = 12 + i * 126;
        return (
          <g key={step}>
            <Box x={x} y={96} w={110} h={44} label={step} lead />
            {i < loop.length - 1 && <ArrowRight x1={x + 112} x2={x + 124} y={118} />}
          </g>
        );
      })}
      <Zone x={4} y={84} w={624} h={68} label="Built first, and it is a whole game" />

      {["Room", "Queue", "Ready", "Synchronised start", "Shared results"].map(
        (extra, i) => {
          const x = 12 + i * 126;
          return (
            <g key={extra}>
              <Box x={x} y={186} w={110} h={40} label={extra} ghost />
              <ArrowDown x={x + 55} y1={152} y2={184} soft />
            </g>
          );
        },
      )}
      <Label x={320} y={244} anchor="middle" tone="faint">
        Added around the loop. None of it replaces a part of it.
      </Label>
    </Diagram>
  );
}
