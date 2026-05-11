// Categories and their associated keywords (lowercase, normalized)
const categoryKeywords = {
  discrimination: [
    'racial slur', 'ethnic slur', 'go back to your country', 'you people', 'lower castes',
    'muslim terrorist', 'jew control', 'filthy', 'dirty [slur]', 'they are all criminals',
  ],
  misogyny: [
    'women belong in kitchen', 'too emotional to lead', 'feminazi', 'useless because woman',
    'she only got job because she is woman', 'women are objects',
  ],
  homophobia: [
    'gay abomination', 'trans are mentally ill', 'lgbtq sin', 'disgusting homosexual',
    'drag queen predator', 'being gay is a choice', 'cure for homosexuality',
  ],
  ableism: [
    'worthless in wheelchair', 'mentally ill locked away', 'deaf useless', 'autistic burden',
    'retarded', 'cripple',
  ],
  ageism: [
    'old people useless', 'gen z lazy', 'boomers ruined', 'teenagers know nothing',
    'too young to understand',
  ],
  body_shaming: [
    'too fat', 'ugly face', 'skinny loser', 'disgusting body', 'obese whale',
    'anorexic skeleton',
  ],
  crime_accusations: [
    'you are a thief', 'pedophile lock up', 'drug dealer', 'belong in prison',
    'convicted felon', 'you stole from them',
  ],
  treason: [
    'traitor to your country', 'betraying our nation', 'enemy of the state', 'spy executed',
    'sellout', 'unpatriotic',
  ],
  glorification_violence: [
    'shoot that politician', 'burn down headquarters', 'deserve to be killed', 'terrorists are heroes',
    'string them up', 'death to all',
  ],
  adultery_shaming: [
    'cheater destroyed family', 'slept around while married', 'adulterers deserve shame',
    'homewrecker', 'unfaithful whore',
  ],
  classism: [
    'poor people lazy', 'rich snobs', 'homeless drug addicts', 'lower class shouldnt breed',
    'welfare queen', 'trailer trash',
  ],
  professional_defamation: [
    'incompetent fired', 'quack doctor', 'slept with boss for promotion', 'garbage code',
    'should never work again', 'fraud',
  ],
  death_threats: [
    'i will kill you', 'won\'t live to see tomorrow', 'dead', 'bullet in your head',
    'dig your grave', 'end your life',
  ],
  harassment: [
    'kill yourself', 'worthless keep posting', 'nobody likes you', 'delete your account',
    'you are a joke',
  ],
  dehumanization: [
    'nothing but a dog', 'animals not humans', 'like vermin', 'pigs deserve no respect',
    'subhuman', 'vermin',
  ],
};

// Normalize text: lowercase, remove punctuation, extra spaces
const normalizeText = (text) => {
  return text.toLowerCase().replace(/[^\w\s]/g, '').replace(/\s+/g, ' ').trim();
};

// Detect category and matched keywords
const detectCategory = (text) => {
  const normalized = normalizeText(text);
  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    const matched = keywords.filter(kw => normalized.includes(kw.toLowerCase()));
    if (matched.length > 0) {
      return { category, matchedKeywords: matched };
    }
  }
  return { category: null, matchedKeywords: [] };
};

module.exports = { detectCategory };