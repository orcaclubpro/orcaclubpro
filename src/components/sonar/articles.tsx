import Link from 'next/link'
import type { ReactNode } from 'react'
import { channelName, type SonarFormat } from './channels'
import {
  ProjectSheet,
  SignalPanel,
  SoundingLine,
  type ProjectSpec,
  type SignalRow,
  type SoundingMark,
} from './rails'

// ---------------------------------------------------------------------------
// SONAR sample articles (Phase 1 — hardcoded). Each entry is keyed by
// `${channel}/${slug}`. Bodies are authored JSX; Phase 2 swaps this for a
// `sonar-articles` Payload collection + Lexical richtext.
// ---------------------------------------------------------------------------

interface CommonArticle {
  channel: string
  slug: string
  format: SonarFormat
  no: string
  title: ReactNode
  who: string
  date: string
  readTime: string
  flag: string
  body: ReactNode
}

export interface DecodeArticle extends CommonArticle {
  format: 'decode'
  standfirst: ReactNode
  sounding: { fill: string; percent: string; left: string; marks: SoundingMark[] }
}

export interface BriefArticle extends CommonArticle {
  format: 'brief'
  thesis: ReactNode
  strip: { k: string; v: ReactNode }[]
  signal: { rows: SignalRow[]; foot: string }
}

export interface FieldNoteArticle extends CommonArticle {
  format: 'fieldnote'
  standfirst: ReactNode
  project: ProjectSpec[]
}

export type SonarArticle = DecodeArticle | BriefArticle | FieldNoteArticle

// Shared funnel block used by Decode + Field Note bodies.
function Funnel({ small, quote, ctaLabel }: { small: string; quote: string; ctaLabel: string }) {
  return (
    <div className="funnel">
      <small>{small}</small>
      <div className="q">{quote}</div>
      <a className="cta" href="/contact">
        {ctaLabel} <span className="ar">→</span>
      </a>
    </div>
  )
}

export const ARTICLES: Record<string, SonarArticle> = {
  'research/the-transformer-decoded': {
    channel: 'research',
    slug: 'the-transformer-decoded',
    format: 'decode',
    no: '038',
    title: (
      <>
        The Transformer, <em>Decoded</em>
      </>
    ),
    who: 'The Sonar Desk',
    date: 'JUL 02 2026',
    readTime: '11 MIN',
    flag: '◆ HIGH SIGNAL',
    standfirst:
      'Eight years of attention, read as one long sentence — what the paper actually said, and what everyone built on top of it since.',
    sounding: {
      fill: '42%',
      percent: '42',
      left: '6m left',
      marks: [
        { at: '0m', label: 'Premise', top: '6%', on: true },
        { at: '4m', label: 'The mechanism', top: '32%', on: true },
        { at: '7m', label: 'What scaled', top: '60%' },
        { at: '11m', label: 'Coda', top: '88%' },
      ],
    },
    body: (
      <div className="body">
        <p className="lead">
          Attention is not a metaphor here — it is the whole machine. Before the transformer,
          sequence models read left to right and forgot as they went. The premise underneath
          everything that followed was smaller and stranger than the hype: let every token look at
          every other token, all at once, and learn what to weight.
        </p>
        <p>
          That single move — parallel, position-agnostic, differentiable — is why the architecture
          scaled where its predecessors stalled. The rest of this piece is bookkeeping on that idea
          <a className="fn" href="#fn1">
            1
          </a>
          , but the idea itself fits in a breath.
        </p>
        <div className="sect">01 — The mechanism</div>
        <p>
          Queries, keys, values. Three projections of the same input, multiplied so that similarity
          becomes routing. It reads like linear algebra because it is, but the consequence is
          behavioral: the model decides, per token, where to spend its attention budget.
        </p>
        <p className="pull">
          Everything since — context windows, retrieval, agents — is a negotiation with the cost of
          looking everywhere at once.
        </p>
        <div className="sect">02 — What scaled</div>
        <p>
          The paper was a translation result. The lineage was a bet: that the same block, stacked
          and widened and fed the open internet, would keep paying off. It did, further than most of
          its authors will admit they expected.
        </p>
        <Funnel
          small="we build what we write about"
          quote="“If the decode above is the capability, the redesign is the proof — identity, site, and system, rebuilt end-to-end.”"
          ctaLabel="Work with ORCACLUB"
        />
      </div>
    ),
  },

  'ai/the-context-window-is-the-moat-now': {
    channel: 'ai',
    slug: 'the-context-window-is-the-moat-now',
    format: 'decode',
    no: '037',
    title: <>The context window is the moat now</>,
    who: 'The Sonar Desk',
    date: 'JUL 01 2026',
    readTime: '7 MIN',
    flag: '◆ SIGNAL',
    standfirst: 'Memory, not parameter count, is where the next margin quietly lives.',
    sounding: {
      fill: '20%',
      percent: '20',
      left: '5m left',
      marks: [
        { at: '0m', label: 'The shift', top: '10%', on: true },
        { at: '3m', label: 'Where memory pays', top: '48%' },
        { at: '7m', label: 'Coda', top: '86%' },
      ],
    },
    body: (
      <div className="body">
        <p className="lead">
          The leaderboard race moved on. The quiet story is that the durable advantage is no longer
          how many parameters you trained — it is how much relevant context you can hold, cheaply, at
          the moment of inference.
        </p>
        <p>
          Context is where product and model finally touch. Whoever owns the workload owns the
          context, and whoever owns the context owns the margin the next generation of tools will be
          priced against.
        </p>
        <Funnel
          small="we build what we write about"
          quote="“We read the frontier so we can build on it — the same instinct we bring to a client's system.”"
          ctaLabel="Work with ORCACLUB"
        />
      </div>
    ),
  },

  'ai/small-models-sharpened-teeth': {
    channel: 'ai',
    slug: 'small-models-sharpened-teeth',
    format: 'decode',
    no: '036',
    title: <>Small models, sharpened teeth</>,
    who: 'The Sonar Desk',
    date: 'JUN 29 2026',
    readTime: '6 MIN',
    flag: '◆ SIGNAL',
    standfirst: "Distillation is eating the mid-tier — a field report from the frontier's cheap seats.",
    sounding: {
      fill: '15%',
      percent: '15',
      left: '5m left',
      marks: [
        { at: '0m', label: 'The squeeze', top: '10%', on: true },
        { at: '3m', label: 'Who wins', top: '50%' },
        { at: '6m', label: 'Coda', top: '86%' },
      ],
    },
    body: (
      <div className="body">
        <p className="lead">
          The interesting models this quarter are not the biggest ones. Distillation has quietly
          collapsed the mid-tier: small models with sharpened teeth now do the work that a frontier
          model did a year ago, at a fraction of the cost.
        </p>
        <p>
          That reshapes what is worth building. When capability gets cheap, the differentiator moves
          up the stack — into taste, workflow, and the surface a user actually touches.
        </p>
        <Funnel
          small="we build what we write about"
          quote="“Cheap capability rewards good design. That is the whole thesis of the studio.”"
          ctaLabel="Work with ORCACLUB"
        />
      </div>
    ),
  },

  'research/retrieval-was-never-the-answer': {
    channel: 'research',
    slug: 'retrieval-was-never-the-answer',
    format: 'decode',
    no: '035',
    title: <>Retrieval was never the answer</>,
    who: 'The Sonar Desk',
    date: 'JUN 26 2026',
    readTime: '8 MIN',
    flag: '◆ HIGH SIGNAL',
    standfirst: 'A quiet re-reading of the RAG literature, and where the citations stop holding.',
    sounding: {
      fill: '18%',
      percent: '18',
      left: '7m left',
      marks: [
        { at: '0m', label: 'The claim', top: '10%', on: true },
        { at: '4m', label: 'The cracks', top: '50%' },
        { at: '8m', label: 'Coda', top: '86%' },
      ],
    },
    body: (
      <div className="body">
        <p className="lead">
          Retrieval-augmented generation was sold as the fix for hallucination. Read the literature
          closely and the story is murkier: retrieval helps at the margins, but the citations stop
          holding exactly where the hard reasoning begins.
        </p>
        <p>
          The lesson is not that retrieval is useless — it is that architecture is not a substitute
          for judgment. The systems that work pair retrieval with a human who knows what good looks
          like.
        </p>
        <Funnel
          small="we build what we write about"
          quote="“The papers decode the method. The build is where judgment gets proven.”"
          ctaLabel="Work with ORCACLUB"
        />
      </div>
    ),
  },

  'markets/the-inference-cost-cliff': {
    channel: 'markets',
    slug: 'the-inference-cost-cliff',
    format: 'brief',
    no: '047',
    title: (
      <>
        The inference-cost cliff — <em>what&apos;s investable</em>
      </>
    ),
    who: 'The Sonar Desk',
    date: 'JUL 02 2026',
    readTime: '4 MIN',
    flag: '◆ HIGH CONVICTION',
    thesis: (
      <>
        The floor under token prices is falling faster than the models are getting bigger. The margin
        is leaving <em>who trains</em> and moving to <em>who serves</em> — and the market hasn&apos;t
        repriced it yet.
      </>
    ),
    strip: [
      {
        k: '$ / 1M tokens · YoY',
        v: (
          <>
            −62%<span className="dn">▾</span>
          </>
        ),
      },
      {
        k: 'Hyperscale capex',
        v: (
          <>
            +34%<span className="up">▴</span>
          </>
        ),
      },
      { k: 'Cost curve · 8q', v: <span className="spark">▇▆▅▃▂▂▁▁</span> },
      { k: 'Near catalysts', v: <>3</> },
    ],
    signal: {
      foot: 'Analyst note · updated 02 JUL 2026',
      rows: [
        { k: 'Conviction', v: 'High' },
        { k: 'Horizon', v: '2–3 quarters' },
        { k: 'Exposure', v: 'Picks & shovels' },
        {
          k: 'Watch',
          v: (
            <>
              3 names <span className="locked">· members</span>
            </>
          ),
        },
      ],
    },
    body: (
      <div className="body">
        <p className="lead">
          The story the tape keeps telling is about training — bigger clusters, bigger raises, bigger
          names. That story is priced. The one underneath it is about serving, and it is moving in
          the opposite direction: the marginal cost of a token has fallen roughly two-thirds in a
          year, and it is still falling.
        </p>
        <p>
          That collapse is not bad news for everyone. It is a transfer. When inference gets cheap, the
          value doesn&apos;t evaporate — it relocates to whoever owns the workload, the distribution,
          and the last mile of latency. The setup is a classic picks-and-shovels rotation, except the
          shovels are getting cheaper and the ground is getting bigger at the same time.
        </p>
        <div className="gate">
          <div className="fade" />
          <div className="plabel">Markets Premium</div>
          <div className="gtitle">
            The full call — positioning, names, and timing — is for members.
          </div>
          <div className="actions">
            <a className="sub" href="#">
              Subscribe <span className="ar">→</span>
            </a>
            <span className="signin">
              Already a member? <a href="#">Sign in</a>
            </span>
          </div>
          <div className="sponsor">
            This brief is supported by — <b>Meridian Capital</b>
          </div>
        </div>
      </div>
    ),
  },

  'markets/the-compute-trade-unwound': {
    channel: 'markets',
    slug: 'the-compute-trade-unwound',
    format: 'brief',
    no: '046',
    title: <>The compute trade, unwound</>,
    who: 'The Sonar Desk',
    date: 'JUN 28 2026',
    readTime: '9 MIN',
    flag: '◆ HIGH CONVICTION',
    thesis: (
      <>
        Who actually pays when GPU depreciation catches up to the balance sheet — and why the{' '}
        <em>second-order</em> names are the real trade.
      </>
    ),
    strip: [
      {
        k: 'GPU depreciation · est.',
        v: (
          <>
            3yr<span className="dn">▾</span>
          </>
        ),
      },
      {
        k: 'Utilization gap',
        v: (
          <>
            wide<span className="up">▴</span>
          </>
        ),
      },
      { k: 'Refresh cycle', v: <span className="spark">▂▃▅▆▇▇▆▅</span> },
      { k: 'Near catalysts', v: <>2</> },
    ],
    signal: {
      foot: 'Analyst note · updated 28 JUN 2026',
      rows: [
        { k: 'Conviction', v: 'High' },
        { k: 'Horizon', v: '3–4 quarters' },
        { k: 'Exposure', v: 'Second-order' },
        {
          k: 'Watch',
          v: (
            <>
              2 names <span className="locked">· members</span>
            </>
          ),
        },
      ],
    },
    body: (
      <div className="body">
        <p className="lead">
          The compute trade was the easiest call of the decade — right up until the depreciation
          schedule came due. The tape is still pricing the buildout; it has barely started pricing the
          bill.
        </p>
        <p>
          When the accounting catches up, the value doesn&apos;t vanish — it rotates. The names that
          benefit are one step removed from the hardware, and the market hasn&apos;t drawn the line
          yet.
        </p>
        <div className="gate">
          <div className="fade" />
          <div className="plabel">Markets Premium</div>
          <div className="gtitle">The full call — positioning, names, and timing — is for members.</div>
          <div className="actions">
            <a className="sub" href="#">
              Subscribe <span className="ar">→</span>
            </a>
            <span className="signin">
              Already a member? <a href="#">Sign in</a>
            </span>
          </div>
          <div className="sponsor">
            This brief is supported by — <b>Meridian Capital</b>
          </div>
        </div>
      </div>
    ),
  },

  'field-notes/rebuilding-lumen': {
    channel: 'field-notes',
    slug: 'rebuilding-lumen',
    format: 'fieldnote',
    no: '012',
    title: (
      <>
        Rebuilding Lumen: <em>identity to system</em> in 21 days
      </>
    ),
    who: 'The Sonar Desk × ORCACLUB',
    date: 'JUL 02 2026',
    readTime: '7 MIN',
    flag: '◆ BUILD',
    standfirst:
      'A billing startup came to us mid-pivot with a logo it had outgrown and a site that undersold it. We rebuilt the whole surface — mark, marketing, and the system underneath — before its next launch.',
    project: [
      { k: 'Client', v: 'Lumen' },
      { k: 'Scope', v: 'Identity, Site, System' },
      { k: 'Duration', v: '21 days' },
      { k: 'Package', v: 'Full Brand Redesign' },
      { k: 'Status', v: 'Shipped', status: true },
    ],
    body: (
      <div className="body">
        <p className="lead">
          Lumen had product-market fit and a brand that quietly worked against it. The wordmark was a
          placeholder that had calcified into the logo; the site was three years of bolt-ons stacked
          on a template. Every new feature made the seams show more. They didn&apos;t need a refresh —
          they needed the surface to finally match the thing they&apos;d built underneath.
        </p>
        <p>
          They came to us because they&apos;d read SONAR. That&apos;s the whole premise of this
          channel: we publish the thinking, and when a reader is ready to build, the work is already
          legible to them. Lumen arrived knowing exactly how we&apos;d approach it.
        </p>
        <div className="sect">01 — The problem</div>
        <p>
          A brand that reads as &ldquo;early&rdquo; when the company is anything but. Inconsistent
          type, a mark that didn&apos;t scale below 32px, and marketing pages that each spoke a
          slightly different language. The cost wasn&apos;t aesthetic — it was trust. Enterprise
          buyers were bouncing before the demo.
        </p>
        <div className="sect">02 — The approach</div>
        <p>
          One sprint, three surfaces, no committee. We ran identity, site, and design system in
          parallel rather than in sequence, so decisions made in the mark propagated into the
          components the same day. Twenty-one days, one shared source of truth, shipped live before
          their funding announcement.
        </p>
        <p className="pull">
          The redesign isn&apos;t a coat of paint — it&apos;s the moment the outside catches up to the
          inside.
        </p>
        <div className="sect">Before / After</div>
        <div className="compare">
          <div className="frame before">
            <span className="tag">Before</span>
            <div className="shot">
              <span className="ph">lumen.io — 2023</span>
            </div>
            <p className="cap">
              Template hero, four competing typefaces, a mark that dissolved at favicon size.
            </p>
          </div>
          <div className="frame after">
            <span className="tag">After</span>
            <div className="shot">
              <span className="ph">lumen.io — rebuilt</span>
            </div>
            <p className="cap">
              One type system, a mark engineered from 16px up, marketing that speaks one voice.
            </p>
          </div>
        </div>
        <div className="sect">What we built</div>
        <ul className="built">
          <li>
            <span className="k">Identity</span>
            <span className="v">
              Wordmark, monogram, and a full type + colour system scaled from favicon to billboard.
            </span>
          </li>
          <li>
            <span className="k">Site</span>
            <span className="v">
              Nine marketing pages rebuilt on a component library — one voice, one grid, one source of
              truth.
            </span>
          </li>
          <li>
            <span className="k">System</span>
            <span className="v">
              A living design system with tokens the team ships against, so the brand holds as they
              grow.
            </span>
          </li>
        </ul>
        <div className="sect">The outcome</div>
        <div className="results">
          <div className="r">
            <div className="n">
              3<span>wk</span>
            </div>
            <div className="l">Turnaround</div>
          </div>
          <div className="r">
            <div className="n">9</div>
            <div className="l">Pages rebuilt</div>
          </div>
          <div className="r">
            <div className="n">
              <span>+</span>launch
            </div>
            <div className="l">Shipped during build</div>
          </div>
        </div>
        <div className="funnel">
          <small>we build what we write about →</small>
          <div className="q">
            “Lumen is the proof. If a Field Note reads like your situation, the same team can rebuild
            your surface — then keep it sharp.”
          </div>
          <div className="paths">
            <div className="opt">
              <span className="k">Project · One-time</span>
              <span className="t">Full Brand Redesign</span>
              <span className="d">Identity, site, and system rebuilt end-to-end, like Lumen.</span>
            </div>
            <div className="to">→</div>
            <div className="opt">
              <span className="k">Recurring</span>
              <span className="t">Marketing Retainer</span>
              <span className="d">We keep it moving — campaigns, iteration, and system upkeep.</span>
            </div>
          </div>
          <a className="cta" href="/contact">
            Start a project with ORCACLUB <span className="ar">→</span>
          </a>
        </div>
      </div>
    ),
  },
}

export function getArticle(channel: string, slug: string): SonarArticle | undefined {
  return ARTICLES[`${channel}/${slug}`]
}

export function articlesByChannel(channel: string): SonarArticle[] {
  return Object.values(ARTICLES).filter((a) => a.channel === channel)
}

// ---------------------------------------------------------------------------
// Templates — one per format. Each returns the center pane + its right rail
// (the two right-hand grid columns; the Spine is rendered by the layout).
// ---------------------------------------------------------------------------

function Eyebrow({ article }: { article: SonarArticle }) {
  const isFieldNote = article.format === 'fieldnote'
  const noLabel =
    article.format === 'brief'
      ? `· signal no. ${article.no}`
      : isFieldNote
        ? `· field note no. ${article.no}`
        : `· decoded no. ${article.no}`
  return (
    <div className="eyebrow">
      {isFieldNote ? <span className="star">★</span> : <span className="dot" />}
      <span className="label crumb">
        <Link href="/">Sonar</Link>
        <span className="sep">/</span>
        <Link href={`/${article.channel}`}>{channelName(article.channel)}</Link>
      </span>
      <span className="mono" style={{ color: 'var(--faint)' }}>
        {noLabel}
      </span>
    </div>
  )
}

function Byline({ article }: { article: SonarArticle }) {
  return (
    <div className="byline">
      <span className="who">{article.who}</span>
      <span className="mono meta">{article.date}</span>
      <span className="mono meta">{article.readTime}</span>
      <span className="mono meta" style={{ color: 'var(--signal)' }}>
        {article.flag}
      </span>
    </div>
  )
}

export function ArticleView({ article }: { article: SonarArticle }) {
  if (article.format === 'brief') {
    return (
      <>
        <main className="read">
          <article className="col">
            <Eyebrow article={article} />
            <h1 className="title">{article.title}</h1>
            <p className="thesis">{article.thesis}</p>
            <Byline article={article} />
            <div className="strip">
              {article.strip.map((f) => (
                <div className="fig" key={f.k}>
                  <span className="k">{f.k}</span>
                  <span className="v">{f.v}</span>
                </div>
              ))}
            </div>
            {article.body}
          </article>
        </main>
        <SignalPanel rows={article.signal.rows} foot={article.signal.foot} />
      </>
    )
  }

  if (article.format === 'fieldnote') {
    return (
      <>
        <main className="read">
          <article className="col">
            <Eyebrow article={article} />
            <h1 className="title">{article.title}</h1>
            <p className="standfirst">{article.standfirst}</p>
            <Byline article={article} />
            {article.body}
          </article>
        </main>
        <ProjectSheet spec={article.project} />
      </>
    )
  }

  // decode
  return (
    <>
      <main className="read">
        <article className="col">
          <Eyebrow article={article} />
          <h1 className="title">{article.title}</h1>
          <p className="standfirst">{article.standfirst}</p>
          <Byline article={article} />
          {article.body}
        </article>
      </main>
      <SoundingLine
        marks={article.sounding.marks}
        fill={article.sounding.fill}
        percent={article.sounding.percent}
        left={article.sounding.left}
      />
    </>
  )
}
