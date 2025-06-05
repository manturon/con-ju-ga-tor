import { render } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import { html } from 'htm/preact';

const VERBS = await fetch('./verbs.json').then((res) => res.json());
const ALL_VERBS = [...VERBS.regular, ...Object.keys(VERBS.irregular)];

const REGULAR_ENDINGS = {
  ar: {
    presente: ['o', 'as', 'a', 'amos', 'an'],
    imperfecto: ['aba', 'abas', 'aba', 'ábamos', 'aban'],
    pretérito: ['é', 'aste', 'ó', 'amos', 'aron'],
    futuro: ['aré', 'arás', 'ará', 'aremos', 'arán'],
    condicional: ['aría', 'arías', 'aría', 'aríamos', 'arían'],
    subjuntivo: ['e', 'es', 'e', 'emos', 'en'],
  },
  er: {
    presente: ['o', 'es', 'e', 'emos', 'en'],
    imperfecto: ['ía', 'ías', 'ía', 'íamos', 'ían'],
    pretérito: ['í', 'iste', 'ió', 'imos', 'ieron'],
    futuro: ['eré', 'erás', 'erá', 'eremos', 'erán'],
    condicional: ['ería', 'erías', 'ería', 'eríamos', 'erían'],
    subjuntivo: ['a', 'as', 'a', 'amos', 'an'],
  },
  ir: {
    presente: ['o', 'es', 'e', 'imos', 'en'],
    imperfecto: ['ía', 'ías', 'ía', 'íamos', 'ían'],
    pretérito: ['í', 'iste', 'ió', 'imos', 'ieron'],
    futuro: ['iré', 'irás', 'irá', 'iremos', 'irán'],
    condicional: ['iría', 'irías', 'iría', 'iríamos', 'irían'],
    subjuntivo: ['a', 'as', 'a', 'amos', 'an'],
  },
};

function regularConjugate(verb) {
  const root = verb.slice(0, -2);
  const ending = verb.slice(-2);
  const conjugations = {};
  for (const tense in REGULAR_ENDINGS[ending]) {
    conjugations[tense] = REGULAR_ENDINGS[ending][tense].map(
      (ending) => root + ending
    );
  }
  return conjugations;
}

function irregularConjugate(verb) {
  const exceptions = VERBS.irregular[verb];
  const regular = regularConjugate(verb);
  const merged = {};
  for (const tense in regular) {
    merged[tense] = regular[tense].map((t, i) => exceptions[tense]?.[i] ?? t);
  }
  return merged;
}

function conjugate(verb) {
  if (verb in VERBS.irregular) {
    return irregularConjugate(verb);
  } else {
    return regularConjugate(verb);
  }
}

const PRONOUNS = ['yo', 'tú', 'él', 'nosotros', 'ellos'];

function InputValue({ conjugation, pronoun, fill }) {
  const [input, setInput] = useState('');
  const correct = input.trim().toLowerCase() === conjugation;
  const empty = !!input.trim();
  return html`<div class="flex flex-col gap-2 items-center">
    <input
      class="border-b-2 text-xl outline-none w-32 ${empty
        ? correct
          ? 'bg-green-100'
          : 'bg-red-100'
        : ''}"
      type="text"
      value=${fill ? conjugation : input}
      disabled=${fill}
      onInput=${({ target }) => {
        if (!fill) {
          setInput(target.value);
        }
      }}
    />
    <span class="text-xl text-gray-700">${pronoun}</span>
  </div>`;
}

function PageButton({ side = 'right', disabled = false, ...rest }) {
  const text = side === 'right' ? '>' : '<';
  return html`<div
    class="w-32 h-full flex justify-center items-center cursor-pointer hover:bg-sky-50"
  >
    <button
      class="rounded-full border-2 w-10 h-10 bg-white"
      type="button"
      disabled=${disabled}
      ${rest}
    >
      ${text}
    </button>
  </div>`;
}

function Exercise({ verb, tense, conjugations, fill }) {
  return html`<div class="flex-1 flex flex-col justify-center h-96">
    <div class="flex-1 flex flex-col justify-center items-center">
      <div class="text-6xl">${verb}</div>
      <div class="text-md">${tense}</div>
    </div>
    <div class="flex flex-row gap-4 justify-center">
      ${conjugations.map(
        (conj, i) =>
          html`<${InputValue}
            conjugation=${conj}
            pronoun=${PRONOUNS[i]}
            fill=${fill}
          />`
      )}
    </div>
  </div>`;
}

function pickRandomVerb() {
  const n = (Math.random() * ALL_VERBS.length) | 0;
  const verb = ALL_VERBS[n];
  const tense = 'presente';
  const conjugations = conjugate(verb)[tense];
  return [verb, tense, conjugations];
}

const [verb, tense, conjugations] = pickRandomVerb();

function App() {
  const [cheat, setCheat] = useState(false);
  useEffect(() => {
    const fn = (e) => {
      if (e.getModifierState('Control') && e.key === '0') {
        setCheat(true);
      }
    };
    window.addEventListener('keydown', fn);
    () => window.removeEventListener('keydown', fn);
  });

  return html`<div class="h-screen flex flex-row items-center">
    <${PageButton} side="left" />
    <${Exercise}
      verb=${verb}
      tense=${tense}
      conjugations=${conjugations}
      fill=${cheat}
    />
    <${PageButton} side="right" />
  </div>`;
}

const $root = document.getElementById('root');

render(html`<${App} />`, $root);

window.conjugate = conjugate;
