import { render } from 'preact';
import { useState, useEffect, useRef, useImperativeHandle } from 'preact/hooks';
import { html } from 'htm/preact';

twind.install({
  presets: [twind.presetExt(), twind.presetTypography()],
  theme: {
    extend: {
      fontFamily: { sans: 'Sono, sans-serif' },
    },
  },
});

const VERBS = await fetch('./verbs.json', { cache: 'force-cache' }).then(
  (res) => res.json()
);
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

const TENSES = [
  'presente',
  'imperfecto',
  'pretérito',
  'futuro',
  'condicional',
  'subjuntivo',
];

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

function InputValue({ conjugation, pronoun, onInput, value, autofocus }) {
  let wide = conjugation.length > 10;

  let correct = value.trim().toLowerCase() === conjugation;
  let empty = !!value.trim();

  return html`<div
    class="flex flex-col gap-2 items-center ${wide ? 'w-48' : 'w-32'}"
  >
    <input
      class="border-b-2 text-xl outline-none ${wide ? 'w-48' : 'w-32'} ${empty
        ? correct
          ? 'bg-green-100'
          : 'bg-red-100'
        : ''}"
      type="text"
      value=${value}
      onInput=${onInput}
      autofocus=${autofocus}
    />
    <span class="text-xl text-gray-700">${pronoun}</span>
  </div>`;
}

function Exercise({
  verb,
  tense,
  conjugations,
  initialValues,
  onInput,
  handleRef,
}) {
  const [values, setValues] = useState(
    initialValues ?? new Array(conjugations.length).fill('')
  );

  useImperativeHandle(
    handleRef,
    () => ({
      fill() {
        let v = [...conjugations];
        setValues(v);
        onInput.call(null, v);
      },
    }),
    []
  );

  const input =
    (i) =>
    ({ target }) => {
      let v = [...values];
      v[i] = target.value;
      setValues(v);
      onInput.call(null, v);
    };

  // Hack to focus first empty input?
  const rootRef = useRef(null);
  useEffect(() => {
    let $empty = Array.from(rootRef.current?.querySelectorAll('input')).find(
      ($input) => !$input.value.trim()
    );
    $empty?.focus();
  }, []);

  return html`<div
    ref=${rootRef}
    class="flex-1 flex flex-col justify-center h-96"
  >
    <div class="flex-1 flex flex-col justify-center items-center">
      <div class="text-6xl">${verb}</div>
      <div class="text-xl mt-2">${tense}</div>
    </div>
    <div class="flex flex-row gap-4 justify-center">
      ${conjugations.map(
        (conj, i) => html`<${InputValue}
          autofocus=${i === 0}
          conjugation=${conj}
          pronoun=${PRONOUNS[i]}
          onInput=${input(i)}
          defaultValue=${values[i]}
          value=${values[i]}
        />`
      )}
    </div>
  </div>`;
}

function pickVerb(n) {
  const verb = ALL_VERBS[n % ALL_VERBS.length];
  const tense = TENSES[(n / ALL_VERBS.length) | 0];
  const conjugations = conjugate(verb)[tense];
  return [verb, tense, conjugations];
}

function randomSeq(n) {
  const total = ALL_VERBS.length * TENSES.length;
  return new Array(n).fill().map(() => (Math.random() * total) | 0);
}

function PageButton({ side = 'right', disabled = false, onClick, ...rest }) {
  const text = side === 'right' ? '>' : '<';
  return html`<div
    class="w-32 h-full flex justify-center items-center ${disabled
      ? 'text-gray-300'
      : 'cursor-pointer hover:bg-sky-50'}"
    onClick=${!disabled ? onClick : undefined}
    ...${rest}
  >
    <button
      class="rounded-full border-2 w-10 h-10 bg-white"
      type="button"
      disabled=${disabled}
    >
      ${text}
    </button>
  </div>`;
}

function App() {
  const [seq, setSeq] = useState(randomSeq(10));
  const [i, setI] = useState(0);

  let [verb, tense, conjugations] = pickVerb(seq[i]);

  const [values, setValues] = useState({
    [verb]: new Array(conjugations.length).fill(''),
  });

  let allCorrect =
    values[verb]?.every(
      (currConj, i) => conjugations[i] == currConj.trim().toLowerCase()
    ) ?? false;

  let move = (n) => {
    n = Math.max(0, Math.min(seq.length - 1, n));
    if (i !== n) {
      setI(n);
    }
  };

  const exRef = useRef(null);

  useEffect(() => {
    const fn = (e) => {
      if (e.getModifierState('Control') && e.key === '0') {
        exRef.current?.fill();
      } else if (e.key === 'Enter') {
        if (allCorrect) {
          move(i + 1);
        }
      }
    };
    window.addEventListener('keydown', fn);
    () => window.removeEventListener('keydown', fn);
  }, [move, allCorrect]);

  return html`<div class="h-screen flex flex-row items-center">
    <${PageButton}
      side="left"
      disabled=${i === 0}
      onClick=${() => move(i - 1)}
    />
    <${Exercise}
      handleRef=${exRef}
      key=${verb}
      verb=${verb}
      tense=${tense}
      conjugations=${conjugations}
      initialValues=${values[verb]}
      onInput=${(v) => setValues({ ...values, [verb]: v })}
    />
    <${PageButton}
      side="right"
      disabled=${!allCorrect || i === seq.length - 1}
      onClick=${() => move(i + 1)}
    />
  </div>`;
}

const $root = document.getElementById('root');

render(html`<${App} />`, $root);

window.conjugate = conjugate;
