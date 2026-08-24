import { Meta } from "../components/Meta";
import { assetUrl } from "../lib/assets";
import { Link } from "../router";
import { Contents } from "./Contents";
import {
  Actually,
  C,
  CaseStudy,
  Decision,
  Figure,
  Item,
  Lead,
  List,
  Masthead,
  P,
  Part,
  PicturePlaceholder,
  Plain,
  Pre,
  Review,
  Section,
  Steps,
  Table,
} from "./CaseStudy";
import {
  DriftDiagram,
  InputPathDiagram,
  LaneDiagram,
  LocalFirstDiagram,
  OwnershipDiagram,
  RoomDiagram,
  RoundStartDiagram,
  TimingDiagram,
} from "./diagrams";
import styles from "./CaseStudy.module.css";

/**
 * =============================================================================
 * CASE STUDY — NEKO DANCER 2.0, SYSTEM DESIGN
 * =============================================================================
 *
 * The first of two. The second is the product design study, which covers the
 * same project from the other side and shares every primitive in this folder.
 *
 * ── The source, and the one editorial rule ──────────────────────────────────
 *
 * The words here are Vero's own specification, restructured for reading rather
 * than rewritten. Where the repository's working documents say something the
 * specification does not — or contradict it outright — that is NOT silently
 * reconciled. It becomes a `<Review>` block and a 🚩 in the contents panel.
 *
 * Silently picking a winner between two of the author's own documents is the
 * single most damaging thing this page could do: it would produce a confident
 * case study that misstates a decision she actually made, and she would find
 * out from someone who read it. Three of those conflicts exist. They are marked
 * and left open.
 *
 * ── What is still a placeholder ─────────────────────────────────────────────
 *
 * Every `<PicturePlaceholder>` is a real gap. They are screenshots of a running
 * build, which exists — see the repository — and they are deliberately not
 * substituted with a drawing, because a diagram of an interface is not evidence
 * that the interface works.
 */

const REPO_NOTE =
  "The prototype it draws on is a private repository. Nothing here links to it.";

export function NekoSystemDesign() {
  return (
    <CaseStudy>
      <Masthead>
        <Meta tracking="wide">Case study — system design</Meta>
        <h1 className={styles.title} data-route-heading>
          Neko Dancer 2.0
        </h1>
        <p className={styles.standfirst}>
          A browser rhythm game where a room full of people play the same song at
          the same time, to music nobody is allowed to download.
        </p>
        <p className={styles.headerNote}>
          Working title. The finished thing will launch under a name of its own.{" "}
          {REPO_NOTE}
        </p>
      </Masthead>

      <Contents />

      <main className={styles.document}>
        {/* ================================================================ */}
        <Part number="01" title="Orientation" />

        <Section id="premise">
          <Lead>
            Neko Dancer 2.0 is an attempt to revive an experience rather than a
            product: the feeling of walking into a shared online room, picking a
            song, and playing it with strangers.
          </Lead>
          <P>
            The original was a browser game where players joined rooms, chatted,
            queued songs and played DDR-style charts together. It has been
            offline for years. This is what that experience looks like rebuilt
            on the web as it exists now — which turns out to be a very different
            web, in one specific way that shapes everything below.
          </P>
          <P>
            The goal is not to make DDR in a browser. Solving that is a weekend.
            The goal is the room.
          </P>
          <Figure caption="Nekodancer, Atelier 801 — a room mid-song. Eleven cats on a rooftop, a video playing on the wall, four lanes at the bottom left, a live ranking at the right and the chat carrying on underneath. Almost none of that is the rhythm game, and all of it is why people stayed.">
            <img
              className={styles.image}
              src={assetUrl("projects/nekodancer-original.jpg")}
              alt="A Nekodancer room in play. Eleven cat avatars in hoodies and caps stand across a fenced rooftop court, several caught mid-pose leaning left or right. A video plays on a screen mounted on the fence behind them. Coloured arrows drift up the court. Bottom left, four large arrows sit above a score reading 2303 and 100 per cent, with a health bar and a x2 multiplier. A ranked list of players runs down the right edge, and a chat conversation in Spanish runs along the bottom. A header bar shows time remaining and a cat count."
              width={1400}
              height={794}
              decoding="async"
            />
          </Figure>
        </Section>

        <Section id="standing">
          <Lead>
            Every constraint below is written the way I reasoned about it before
            building anything, and then followed by what building it actually
            turned up.
          </Lead>
          <P>
            So the sections read forward — <em>the problem I expect to hit</em>,{" "}
            <em>the decision I expect to make</em> — and each one ends with a
            short note marked <em>what actually happened</em>. Where a prediction
            held, the note says how it was proved. Where it did not, the
            prediction stays on the page and the note says what replaced it.
          </P>
          <P>
            There is a working prototype behind this: the engine, five-tier
            judgment, chart authoring by tapping, a PixiJS playfield, and
            multiplayer rooms with chat over a local network, under 1,146 tests.
            Nothing here is speculative because there was nothing to build it
            with. It is written forward because that is the order the thinking
            happened in, and because the guesses are the interesting part.
          </P>
        </Section>

        <Section id="problem">
          <P>
            How do you build a browser-based multiplayer rhythm game where:
          </P>
          <List>
            <Item>players choose music from YouTube</Item>
            <Item>players use charts the community made</Item>
            <Item>gameplay feels responsive locally</Item>
            <Item>several players take part in the same song</Item>
            <Item>everyone can see what everyone else is doing, live</Item>
            <Item>chat and presence stay in step</Item>
            <Item>a brief network problem does not ruin the round</Item>
            <Item>
              the platform can eventually hold a library of charts people made
              themselves
            </Item>
          </List>
          <P>
            Every constraint below is downstream of one of those lines, and the
            interesting ones are downstream of two that disagree.
          </P>
        </Section>

        <Section id="goals">
          <Decision claim="Local gameplay">
            Browse charts, pick a song, play. No multiplayer connection
            required, and no account required to try it.
          </Decision>
          <Decision claim="Chart creation">
            Someone can author a chart against a supported piece of media, and
            the tooling has to be approachable to a person who is not already a
            rhythm-game creator.
          </Decision>
          <Decision claim="Multiplayer rooms">
            Join a shared room, chat, queue music, mark yourself ready, play a
            song together, and see how everyone did.
          </Decision>
          <Decision claim="Community persistence">
            Charts, scores, users and eventually community content outlive any
            individual session. A room is a place people pass through; the
            library is the thing that accumulates.
          </Decision>
        </Section>

        {/* ================================================================ */}
        <Part number="02" title="Constraints" />

        <Section id="media">
          <Lead>
            The first constraint is the one that shapes the system: I can show a
            YouTube video, and I can do nothing else to it.
          </Lead>
          <P>
            The original existed on a very different web. A modern build cannot
            assume unrestricted access to the audio — the embed offers no
            samples, and extracting or isolating the audio is against the
            developer policies regardless. So the rhythm game has to exist
            entirely beside the media rather than on top of it.
          </P>

          <Decision claim="YouTube owns playback. Neko Dancer owns the game.">
            A chart <em>references</em> a video; it never contains one. The
            server stores game data and no media at all, and each client
            independently loads the same source. That is not only a legal
            position — it is also why the server never has to move a single
            audio byte between players.
          </Decision>

          <Figure caption="The boundary the whole system is built around. One video id crosses it, in one direction. Everything a player earns, authors or is judged on lives on the right.">
            <OwnershipDiagram />
          </Figure>

          <P>
            One song can therefore have many charts — different difficulties,
            different authors, different readings of the same track — and none of
            them duplicates anything. If a chart already exists for a video, it
            plays immediately. If it does not, the video is a candidate for the
            chart creator.
          </P>

          <Actually>
            <p>
              The boundary held exactly as drawn, and then broke somewhere I had
              not thought to look. Some videos refuse to embed at all, and{" "}
              <strong>
                YouTube also refuses restriction-bearing videos when the page is
                served from a bare IP address
              </strong>{" "}
              — the same video plays happily from a hostname. It looked like a
              bug in the game for most of a day.
            </p>
            <p>
              That turned into a real feature rather than a workaround: the room
              now runs a preflight, asking every client whether it can play this
              video before the round is allowed to start.
            </p>
          </Actually>
        </Section>

        <Section id="chart">
          <Lead>
            My first instinct was to detect the song&rsquo;s BPM and generate
            gameplay from it. That does not work, and understanding why is most
            of the chart format.
          </Lead>
          <P>
            BPM says how far apart beats are. It does not say where the first one
            is, and it says nothing at all about music that has tempo changes, a
            pickup before the downbeat, syncopation, rests, or notes deliberately
            placed off the beat. A grid derived from a single tempo describes a
            metronome, not a song.
          </P>

          <Figure caption="Above: what a BPM alone can generate. Below: the same passage as actually played. Every place they disagree is a note the player would be judged wrongly on.">
            <TimingDiagram />
          </Figure>

          <Decision claim="A chart is a list of timed events, not a tempo.">
            The stored unit is a note with a time, a lane and a type. Nothing at
            playback recomputes it from a tempo, which also means a published
            chart keeps playing exactly as its author published it even after the
            generator that helped make it has changed.
          </Decision>

          <Pre label="The note, and it is nearly the whole format">{`{
  timeMs: 42813,
  lane:   "left",
  type:   "tap"
}`}</Pre>

          <P>
            BPM is still enormously useful — in the <em>editor</em>. Beat grids,
            snapping, subdivisions, visualising where the notes should fall: all
            of that is authoring, and all of it happens before anything is
            stored. The runtime needs a timestamp, a lane and a type.
          </P>

          <Plain term="Offset">
            The gap between the start of the video and the first musical beat. At
            120 BPM the beats are 500&nbsp;ms apart, but they might fall at 237,
            737, 1237&nbsp;ms — the spacing and the starting point are two
            separate facts, and a chart needs both.
          </Plain>

          <Actually>
            <p>
              Charts are authored by tapping along while the song plays. The
              recorder fits a tempo grid to the taps by least squares and snaps
              the notes onto it, so BPM and offset are both derived from the same
              performance rather than guessed at separately.
            </p>
            <p>
              One thing I got wrong and had to reverse: the first format stored
              note times relative to the grid <em>and</em> a chart offset
              alongside them, which meant the offset could be — and once was —
              applied twice. <strong>Note times are now absolute</strong>, and
              the timing grid is authoring metadata that never reaches playback.
              The first chart schema was abandoned outright rather than migrated.
            </p>
          </Actually>
        </Section>

        <Section id="client">
          <Lead>
            A rhythm game is judged in tens of milliseconds. Nothing that decides
            whether a note was hit is allowed to touch the network.
          </Lead>
          <P>
            Sending a keypress to a server and waiting to be told whether it
            landed would add the round trip to every single note. On a good
            connection that is 30&nbsp;ms; on a bad one it is 200, and the
            judgment windows are tighter than that. So the client owns rendering,
            input, timing windows, combo, local score, hit feedback and
            animation, and the server sits nowhere near any of it.
          </P>

          <Figure caption="The short loop is the game. The long one is everybody else finding out about it, and nothing waits on it.">
            <InputPathDiagram />
          </Figure>

          <Plain term="Input authority">
            Who is allowed to decide what happened. Here the client decides,
            which is the right trade for a game where feeling responsive matters
            more than being un-cheatable — and the wrong trade for a game with
            money or rankings on it.
          </Plain>

          <Actually>
            <p>
              This one paid off more than expected, because of how far the
              separation was taken:{" "}
              <strong>the engine is handed the current song time as a number</strong>{" "}
              and has no reference to the video player at all. An engine that
              cannot call <C>play()</C> can be tested by passing it{" "}
              <C>10_000</C>, so the entire game runs headless with a fake clock —
              219 tests, no browser, no video, no audio.
            </p>
          </Actually>
        </Section>

        <Section id="lanes">
          <P>
            Four lanes: left, down, up and right. They can be played with the
            arrow keys or with WASD, interchangeably, and a player can switch
            between the two in the middle of a song. The important part is what
            gets <em>stored</em>: the game records a lane, never a key.
          </P>

          <Figure caption="The conversion happens in the input layer, before anything is judged or saved. Everything below the dashed line speaks only in lanes.">
            <LaneDiagram />
          </Figure>

          <Decision claim="A lane is a direction, not a key.">
            If a lane&rsquo;s identity <em>is</em> a key, then a player who
            rebinds to arrow keys is playing charts whose lanes are named after
            keys they no longer press — and every stored note in the database is
            wrong for them. The meaning of stored data would change with a
            client-side setting, which is the one property a schema must never
            have. Keeping lanes semantic also leaves hold notes and a possible
            six-lane mode unaffected.
          </Decision>

          <Actually>
            <p>
              The cheapest decision in the project — the input layer already
              mapped both key sets to lanes before this was written down, so
              accepting it cost nothing and closed off a class of migration that
              would have been very expensive later.
            </p>
          </Actually>
        </Section>

        <Section id="authority">
          <Lead>
            Players need to feel like they are playing together. They do not need
            to be running the same copy of the game, and not needing that saves
            an enormous amount of work.
          </Lead>
          <P>
            Every player runs their own game from start to finish. Their browser
            reads their keys, judges their hits and keeps their score, and no
            other machine is involved in any of it. The socket carries only what
            other people need in order to see that you are there and playing —
            never the keys you pressed.
          </P>
          <Pre label="Roughly the whole message set">{`PLAYER_READY        SONG_SELECTED       CHAT_MESSAGE
PLAYER_NOT_READY    SONG_QUEUED         PLAYER_STATUS

ROUND_PREPARE       PLAYER_POSE         ROUND_COMPLETE
ROUND_START         PLAYER_COMBO`}</Pre>
          <P>
            Nobody transmits a keypress and nobody transmits audio. The heaviest
            thing on the wire during a round is a periodic score summary.
          </P>

          <Actually>
            <p>
              The architecture was right and the interface quietly undid it. The
              menu kept a <strong>Play</strong> button that started a solo run
              immediately, sitting a few inches from the ready control, while the
              server was counting the room down — so people pressed it and
              started their own private song three seconds out of step with
              everyone else.
            </p>
            <p>
              1,146 tests could not see it, because the multiplayer suite drives
              raw sockets and the bug was a button. That is now the argument for
              adding browser-level tests: the protocol was never wrong.
            </p>
          </Actually>
        </Section>

        {/* ================================================================ */}
        <Part number="03" title="Multiplayer" />

        <Section id="room">
          <Lead>
            A room is a shared session, and one screen holds all of it: players,
            chat, the song browser, the queue and the ready control.
          </Lead>
          <P>
            There is deliberately no matchmaking &rarr; selection &rarr; lobby
            &rarr; gameplay sequence. You are in the room, and the room is where
            everything happens — including between songs, which is most of the
            time people spend there.
          </P>
          <P>
            If several players pick different songs, all of them go on the queue.
            Nothing has to resolve a vote.
          </P>

          <Figure caption="A room holds a lot and owns almost none of it. Everything on the left is memory; everything on the right survives the room being closed.">
            <RoomDiagram />
          </Figure>

          <Decision claim="A room is not a database.">
            Room state lives in memory on the server and dies with the room.
            Charts, users and scores live in Postgres. Blurring that line is how
            a chat log ends up in a schema migration.
          </Decision>

          <Figure caption="The room screen as built — the piece that has to hold people between songs.">
            <PicturePlaceholder
              what="Screenshot of the current room: player list, chat, song queue, ready controls."
              source="Local build. Two browser origins side by side shows presence better than one."
            />
          </Figure>
        </Section>

        <Section id="start">
          <Lead>
            Getting several browsers to begin the same song at the same moment is
            the first genuinely distributed problem in the project.
          </Lead>
          <P>
            The order matters more than the mechanism. Everyone readies, then
            everyone <em>loads</em>, then everyone confirms they are loaded, and
            only then does the count begin. Going straight from ready to
            countdown means a player whose video is still buffering starts late
            and loses the opening bars — and it is not recoverable, because the
            song does not wait.
          </P>

          <Figure caption="Prepare, confirm, then start. The dashed band is the step that is easy to skip and expensive to skip.">
            <RoundStartDiagram />
          </Figure>

          <Plain term="Preflight">
            Asking every client, before the round, whether it can actually play
            this video — some videos refuse to embed at all, and some refuse
            depending on where the page is served from. Finding out during the
            countdown is finding out too late.
          </Plain>

          <Decision claim="The start signal is a duration, not a time of day.">
            <p>
              The obvious design is for the server to say &ldquo;start at
              10:42:07.500&rdquo; and let every client work out how long that is
              from now. It does not survive contact with real machines: two
              computers&rsquo; clocks routinely disagree by seconds, sometimes by
              minutes, so a client comparing that timestamp to its own clock
              either starts instantly or sits waiting for a time that has already
              passed.
            </p>
            <p>
              So the message carries <C>startInMs: 3000</C> — start three seconds
              from when you receive this. A duration means the same thing on
              every machine and needs no clock synchronisation at all. It is
              exact to the message&rsquo;s own travel time, which on a local
              network is a millisecond or two.
            </p>
            <p>
              Sending a timestamp only becomes workable alongside a clock-offset
              exchange at join, the way NTP does it. That is worth building when
              rounds run across the internet rather than a house, and the message
              is shaped so it can be swapped in without the game engine noticing.
            </p>
          </Decision>

          <Actually>
            <p>
              The duration is built and covered by tests that run three separate
              clocks against each other. <strong>The prepare step is not.</strong>{" "}
              The room currently goes straight from everyone-ready to the
              countdown, so a slow-loading player still starts late — the{" "}
              <C>roundPrepare</C> message and its timeout exist in the protocol
              and nothing sends them yet. It is the next thing on the list.
            </p>
          </Actually>
        </Section>

        <Section id="sync">
          <Lead>
            This is about the video, not about the player. Everyone is watching
            their own copy of the same YouTube stream, and those copies do not
            stay perfectly level with each other.
          </Lead>
          <P>
            Nothing here concerns a player mistiming their keys — that is just
            playing badly, and the game judges it honestly. The problem is that
            two people who started together can end up thirty seconds into the
            song at genuinely different points in it, because one of them buffered
            and the other did not. Network speed, YouTube&rsquo;s own start-up
            time, rendering performance, a backgrounded tab and a momentary
            disconnect all open that gap.
          </P>

          <Plain term="Drift">
            Two players&rsquo; videos slowly getting out of step with each other —
            not a jump, a gap that widens. It matters because each player is
            judged against their own copy of the music, so a drifted player is
            being scored on a slightly different performance from everyone else.
          </Plain>

          <Figure caption="One player buffers, falls behind the expected position, and never quite catches up. Inside the band the difference is small enough to ignore; past it, the room is told.">
            <DriftDiagram />
          </Figure>

          <Decision claim="Measure the drift and show it. Never fix it.">
            <p>
              <strong>Judging stays local.</strong> Each player is judged against
              the song as their own browser is actually playing it. That is the
              only version of events they experienced, and scoring them against
              anyone else&rsquo;s copy would punish them for a slow connection.
            </p>
            <p>
              <strong>Drift becomes visible.</strong> Each client reports where
              its video actually is, and the room shows it. That is the whole
              value of measuring: it turns &ldquo;that round felt off&rdquo; into
              a number someone can point at, during the round rather than after
              it.
            </p>
            <p>
              <strong>The video is never moved.</strong> No seeking, no
              speeding-up, no silent correction. Jumping someone&rsquo;s song
              forward mid-round to fix a number on a scoreboard is worse than the
              problem, and it breaks the rule the rest of the design depends on:
              nothing ever adjusts the song underneath the person playing it.
            </p>
          </Decision>

          <P>
            Which makes the shared scoreboard an approximate thing, and that is an
            accepted cost. Everyone played the same chart, and each score is a
            true record of the round that player actually had.
          </P>

          <Actually>
            <p>
              Judging on the local clock is built and the game has been played
              through on two machines over a local network. What does not exist
              yet is the readout — <C>connected</C> and per-player position are
              in the protocol and unused, so today a drifted or dropped
              player&rsquo;s score simply stops moving on everyone else&rsquo;s
              screen with no explanation of why.
            </p>
          </Actually>
        </Section>

        <Section id="avatars">
          <P>
            A player is represented by an avatar, and the same avatar follows them
            everywhere they appear: the room&rsquo;s player list, the chat, the
            results leaderboard, and the playfield during a round.
          </P>
          <P>
            During a song each avatar animates to what its player is doing. That
            costs no new machinery, which is the part that matters here: the lane
            events are already on the wire for presence, so the animation is a
            read of data the room is sending anyway.
          </P>
          <Pre label="What each lane says the avatar should do">{`LEFT    lean or step left
RIGHT   lean or step right
UP      jump
DOWN    crouch, bow, curtsy`}</Pre>

          <Decision claim="Avatars are fed poses, not results.">
            <p>
              What leaves a machine is <em>which lane, and when</em> — never
              whether the note was hit, missed, or how close it was. Other
              clients cannot reconstruct a run from what they receive, and they
              are not meant to.
            </p>
            <p>
              That keeps the animation stream on the safe side of every failure.
              A pose message that arrives late, out of order or not at all costs
              one frame of someone else&rsquo;s cat and can never desynchronise a
              game, alter a judgment, or change a score — because no game state
              anywhere is derived from it. It is the one part of the protocol
              allowed to be lossy, and saying so explicitly is what lets it be
              sent frequently and cheaply.
            </p>
          </Decision>

          <Figure caption="The four lane poses plus idle. Original art — the original's cat belongs to somebody else.">
            <PicturePlaceholder
              what="Avatar sprite sheet or animation reference — the four lane poses, plus idle."
              source="Original art. See the project's art brief."
            />
          </Figure>

          <Actually>
            <p>
              Everyone&rsquo;s cat moves on everyone&rsquo;s screen, and it was
              the moment the room stopped feeling like several people playing
              alone at the same time.
            </p>
          </Actually>
        </Section>

        <Section id="scores">
          <Lead>
            Scores are computed on the machine that played them, which means the
            server is trusting the client. That is a choice with a shelf life.
          </Lead>
          <P>
            During a round, score is local. At the end, the client reports a
            result and the server aggregates the room into a ranking. For a
            community game among people who came to play together, that is
            correct: the alternative is validating every keystroke server-side,
            which costs the responsiveness the whole design was built to protect.
          </P>
          <P>
            Nothing about a run leaves the machine until it is over. The pose
            events sent during the song carry a lane and a time and nothing else,
            so the room can watch you play without ever seeing your judgments —
            the score arrives once, at the end, as a result.
          </P>
          <Decision claim="Anti-cheat is a later problem, and a different one.">
            If competitive rankings ever matter, score verification becomes its
            own system design exercise — replay submission, server-side
            re-judgment from the input trace, statistical outlier detection.
            None of that changes the gameplay architecture, which is the reason
            it can be deferred honestly rather than hopefully.
          </Decision>
        </Section>

        {/* ================================================================ */}
        <Part number="04" title="Data" />

        <Section id="persistence">
          <P>
            The split is the same one the room diagram drew, stated as entities.
          </P>
          <Table
            caption="What the database holds, and what only exists while people are in the room"
            head={["Entity", "Holds", "Lifetime"]}
          >
            <tr>
              <td>User</td>
              <td>Identity, display name, calibration, preferences</td>
              <td>Permanent</td>
            </tr>
            <tr>
              <td>Song</td>
              <td>Provider, video id, title, artist, duration</td>
              <td>Permanent</td>
            </tr>
            <tr>
              <td>Chart</td>
              <td>Song, author, difficulty, tags, note data</td>
              <td>Permanent</td>
            </tr>
            <tr>
              <td>Score</td>
              <td>User, chart, result</td>
              <td>Permanent</td>
            </tr>
            <tr>
              <td>Room</td>
              <td>Players, queue, ready state, round state</td>
              <td>Dies with the room</td>
            </tr>
          </Table>
          <P>
            Local storage in the browser is for preferences, key bindings,
            calibration and cached chart payloads. It is a cache and never a
            source of truth — which is a correction to an earlier version of this
            project, where charts existed only in one browser and therefore could
            not form a shared library at all. That single limitation is most of
            why there is a database in this design.
          </P>
        </Section>

        <Section id="versioning">
          <Lead>
            An author edits a chart. Forty people have already played it and have
            scores against it. What happens?
          </Lead>
          <P>
            Nothing, is the answer, and it is the immutability that buys it.{" "}
            <strong>A published chart cannot be modified.</strong> Editing one
            does not change it — it creates a new revision beside it, and the old
            revision keeps playing exactly as it always did.
          </P>
          <Pre label="One song, several readings of it, each with its own history">{`Song — Rain On Me
├─ Chart by Vero            ├─ Revision 1   └─ Revision 2
└─ Chart by another player  └─ Revision 1`}</Pre>
          <Decision claim="A score belongs to the revision it was played on.">
            <p>
              So editing a chart never disturbs a leaderboard. Revision 1 keeps
              its scores and keeps playing exactly as those scores were set;
              revision 2 starts its own board from empty. Nobody&rsquo;s result
              is deleted, recalculated, or quietly moved onto a chart they never
              played.
            </p>
            <p>
              It also means the comparison is always honest. Two scores on the
              same board were set on byte-identical note data, which is the only
              condition under which comparing them means anything.
            </p>
          </Decision>
          <Decision claim="Saving is a reference. Forking is a copy.">
            <p>
              Adding someone else&rsquo;s chart to your library stores a pointer,
              not a duplicate, so their fixes reach you. Changing it forks: a new
              chart, with its own author, its own revision history and its own
              scores.
            </p>
            <p>
              Two verbs, because one verb that silently does both is how a
              library fills with near-identical copies of the same chart.
            </p>
          </Decision>

          <Actually>
            <p>
              Immutability is a property the storage layer has to enforce rather
              than a rule everyone agrees to follow, so the gate on this phase is
              a test that publishes the same chart twice and checks that the first
              revision came out byte-identical.
            </p>
          </Actually>
        </Section>

        {/* ================================================================ */}
        <Part number="05" title="When it breaks" />

        <Section id="failure" flagged>
          <Lead>
            Every one of these has a default behaviour if it is not designed, and
            every one of those defaults is bad.
          </Lead>
          <Table head={["What happens", "What should happen"]}>
            <tr>
              <td>The video is gone</td>
              <td>
                The chart still exists. It is shown as unavailable rather than
                failing silently or half-loading.
              </td>
            </tr>
            <tr>
              <td>A player disconnects</td>
              <td>
                Everyone else keeps playing. Their score stops moving and they
                are marked as dropped, not frozen mid-round with no explanation.
              </td>
            </tr>
            <tr>
              <td>A player reconnects</td>
              <td>Undecided — see below.</td>
            </tr>
            <tr>
              <td>One player loads slowly</td>
              <td>
                The round does not begin until required players report prepared.
                This is the prepare step above.
              </td>
            </tr>
            <tr>
              <td>The socket drops mid-song</td>
              <td>
                Local gameplay continues to the end. Chat and presence stop; the
                rhythm game does not.
              </td>
            </tr>
            <tr>
              <td>One player&rsquo;s video is blocked</td>
              <td>
                It must not hold the room. Skip, spectate, or drop them from the
                ready requirement — but detected <em>before</em> the round.
              </td>
            </tr>
          </Table>
          <P>
            The last row is not hypothetical, and it produced the most
            memorable finding in the project: YouTube refuses to embed
            restriction-bearing videos when the page is served from a bare IP
            address, and serves them happily from a hostname. Six attempts
            against five. That was a day, and it was a day spent because the
            failure looked like a bug in the game.
          </P>

          <Review>
            <p>
              <strong>What happens to someone who drops mid-song?</strong> It is
              the last undecided row in the table, and it is the one row where
              doing nothing is itself a choice — today they simply come back to a
              room that has moved on without them.
            </p>
            <p>
              <strong>(a) Wait for the next song.</strong> Simplest. They rejoin
              the room, cannot ready, and pick up at the next round. Their score
              for the interrupted song is lost.
              <br />
              <strong>(b) Spectate the rest.</strong> They rejoin and watch the
              round finish. Costs a spectator mode — which also solves joining a
              room mid-round and the blocked-video case, so it is worth more than
              it looks.
              <br />
              <strong>(c) Resume playing.</strong> They rejoin and carry on from
              wherever the song now is. The most generous and by far the most
              work: their video has to be seeked to the right place, which is the
              one thing the sync section just ruled out doing.
            </p>
            <p>
              (b) is the one I would build, because the spectator mode pays for
              itself three times over. But it is real work, and (a) is honest and
              free, so it is your call whether it waits.
            </p>
          </Review>
        </Section>

        {/* ================================================================ */}
        <Part number="06" title="Sequencing" />

        <Section id="local-first">
          <Lead>
            Multiplayer adds a great deal of complexity, so the first playable
            architecture has none of it.
          </Lead>
          <P>
            A complete single-player loop — pick, load, play, score — is a whole
            game. It is also the only environment in which the timing windows,
            the note rendering, the input mapping, the chart format and the media
            synchronisation can be tested without a second machine in the loop
            confusing every result.
          </P>
          <Figure caption="Multiplayer is arranged around the loop rather than inside it. Nothing in the top row is replaced by anything in the bottom row.">
            <LocalFirstDiagram />
          </Figure>
          <P>
            This is also the strongest architectural claim in the project:
            multiplayer is the same engine plus room orchestration plus realtime
            player state. It is not a second implementation of the rhythm game.
            The moment there are two, they disagree, and the disagreement shows
            up as one player&rsquo;s screen judging differently from another.
          </P>
        </Section>

        <Section id="order">
          <P>Three groups, in order, each shippable.</P>
          <Steps>
            <Item>
              <strong>A game.</strong> YouTube embed playback · chart format ·
              the rhythm renderer · WASD and arrow input · local scoring · a
              chart library · results.
            </Item>
            <Item>
              <strong>A room.</strong> WebSocket rooms · presence · chat · the
              song queue · ready state · synchronised start · shared results.
            </Item>
            <Item>
              <strong>A community.</strong> The chart editor · user-created
              charts · profiles · community features.
            </Item>
          </Steps>
          <P>
            The ordering is not about difficulty. It is that each group is
            playable on its own, and a thing that can be played gets played —
            which is the only way the problems in the next group get found by
            someone other than me.
          </P>
        </Section>

        {/* ================================================================ */}
        <Part number="07" title="Reflection" />

        <Section id="principles">
          <Decision claim="Local-first gameplay">
            Network latency never decides whether a note feels responsive.
          </Decision>
          <Decision claim="Server-coordinated, not server-simulated">
            The server coordinates rooms, shared state and start timing. It does
            not run anybody&rsquo;s game.
          </Decision>
          <Decision claim="Media is separate from gameplay">
            YouTube provides the music. Neko Dancer provides the game. Nothing
            downloads, stores or serves the media.
          </Decision>
          <Decision claim="Persistent charts, temporary sessions">
            Community-created content outlives the rooms it was played in.
          </Decision>
          <Decision claim="Graceful degradation">
            Losing a socket costs you the multiplayer features. It does not cost
            you the song you are in the middle of.
          </Decision>
        </Section>

        <Section id="questions">
          <P>
            Unresolved on purpose. Each of these is waiting on a prototype rather
            than on more thinking.
          </P>
          <List>
            <Item>
              <strong>Timing.</strong> How tightly can several YouTube embeds
              realistically stay in step across machines?
            </Item>
            <Item>
              <strong>Chart storage.</strong> Notes as rows, as structured JSON,
              or as a versioned chart document?
            </Item>
            <Item>
              <strong>Multiplayer authority.</strong> Which events should the
              room server validate rather than relay?
            </Item>
            <Item>
              <strong>Reconnection.</strong> What should happen to someone who
              comes back halfway through a song? Marked in the failure table
              above, and the only decision on this page still genuinely open.
            </Item>
            <Item>
              <strong>Spectators.</strong> Can a room hold people who want to
              watch and not play? It is also the answer to a blocked video and to
              joining mid-round, which makes it worth more than it first looks.
            </Item>
            <Item>
              <strong>Chart editing.</strong> What tooling makes authoring
              approachable to someone who is not already a rhythm-game creator?
              This is the one that decides whether there is a community at all.
            </Item>
          </List>
        </Section>

        <Section id="learning">
          <P>
            This project is deliberately outside my usual application work while
            still being built with tools I know: real-time communication,
            multiplayer state, client and server authority, synchronisation, game
            loops, browser media APIs, timing-sensitive interfaces, resilient
            socket architecture, and community-generated content.
          </P>
          <P>
            I am not learning those first and then building this. I am using this
            as the place to learn them, which means the architecture is going to
            keep moving as the assumptions get tested — and the parts of this
            document that turn out to be wrong are the parts worth having written
            down.
          </P>
        </Section>

        <p className={styles.back}>
          <Link to="home" className={styles.backLink}>
            <Meta as="span">Back</Meta>
          </Link>
        </p>
      </main>
    </CaseStudy>
  );
}
