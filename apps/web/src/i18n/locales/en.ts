import { solverEn } from '../crafting'

export default {
  analytics: {
    message: 'This site uses Google Analytics to improve the tool.',
    accept: 'Accept',
    reject: 'Reject',
  },
  app: {
    title: "Frozen Rabbit's Cosmic",
    subtitle: 'Cosmic Exploration expert crafting assistant',
    logoAlt: "Frozen Rabbit's Cosmic logo",
  },
  common: {
    close: 'Close',
    toggleMenu: 'Toggle menu',
    closeMenu: 'Close menu',
  },
  nav: {
    primary: 'Primary navigation',
    start: 'Start from a Mission',
    equipmentProfiles: 'Equipment Profiles',
    solver: 'Craft Solver',
    favorites: 'My Favorites',
    faq: 'FAQ',
    settings: 'Cosmic Settings',
    sponsor: 'Help power the freezer',
    github: 'Open Source (GitHub)',
  },
  missions: {
    eyebrow: 'Cosmic Exploration', title: 'Start from a Mission', description: 'Search for a mission or item name to start solving.',
    searchLabel: 'Search missions or items', searchPlaceholder: 'Search missions or items…', loading: 'Loading mission data…',
    loadError: 'Mission data is temporarily unavailable.', retry: 'Try again', empty: 'No missions match your search.',
    resultCount: '{count} missions', itemCount: '{count} crafted items', loadMore: 'Show more missions', chooseItem: 'Choose an item to craft', chooseEquipmentProfile: 'Choose an equipment profile', equipmentProfileLabel: 'Equipment profile', equipmentRelicEffect: 'Relic effect', equipmentSpecialist: 'Specialist actions', preparingSolver: 'Preparing the solver…', solverLoadError: 'The solver could not be loaded. Please try again.', retrySolver: 'Reload solver', startCrafting: 'Start crafting', favoriteSoon: 'Reserved for favorites',
    filters: { open: 'Filter missions', title: 'Filters', job: 'Crafting job', rank: 'Mission difficulty', planet: 'Star', type: 'Type', clear: 'Clear', apply: 'Apply' },
    jobs: { carpenter: 'Carpenter', blacksmith: 'Blacksmith', armorer: 'Armorer', goldsmith: 'Goldsmith', leatherworker: 'Leatherworker', weaver: 'Weaver', alchemist: 'Alchemist', culinarian: 'Culinarian' },
    ranks: { a: 'A', ex: 'EX', 'ex-plus': 'EX+', master: 'Master' },
    planets: { 'sinus-ardorum': 'Sinus Ardorum', phaenna: 'Phaenna', oizys: 'Oizys', auxesia: 'Auxesia' },
    types: { timed: 'Timed', weather: 'Weather' },
  },
  favorites: {
    title: 'My Favorites', description: 'Browse only your saved missions, then search, filter, and start crafting as usual.',
    add: 'Add {name} to favorites', remove: 'Remove {name} from favorites', addShort: 'Add to favorites', removeShort: 'Remove from favorites',
    empty: 'You have not saved any missions yet. Select the heart on Start from a Mission to add one.', noMatch: 'No saved missions match these filters.',
  },
  equipmentProfiles: {
    title: 'Crafter Equipment Profiles', description: 'Save final panel stats as reusable profiles and apply them after choosing a mission.',
    listTitle: 'Profiles', add: 'New', editTitle: 'Edit Profile', defaultLocked: 'The default profile cannot be deleted and applies to every crafter.',
    defaultName: 'Default Crafter', unnamed: 'Unnamed Profile', defaultBadge: 'Default', allJobs: 'All Crafters', jobCount: '{count} crafting jobs',
    name: 'Profile name', jobs: 'Available jobs', level: 'Level', craftsmanship: 'Craftsmanship', control: 'Control', cp: 'Maximum CP', afterConsumables: '(with consumables {value})',
    applyToJobs: 'Apply to {count} jobs', jobDialogTitle: 'Choose crafting jobs', jobDialogDescription: 'Choose which crafting jobs can use these panel stats. Keep at least one selected.', jobDialogDone: 'Done',
    food: 'Food', medicine: 'Medicine', searchFood: 'Search food', searchMedicine: 'Search medicine', none: 'None selected', noFood: 'No food', noMedicine: 'No medicine',
    consumablesLoading: 'Loading consumables…', consumablesError: 'Consumable data is temporarily unavailable. Please try again later.',
    quality: { hq: 'HQ', nq: 'NQ' }, bonusMax: 'max', bonusStats: { craftsmanship: 'Craftsmanship', control: 'Control', maxCp: 'CP' },
    relicTool: 'Relic tool effect', relicToolOption: 'High Quality increase x1.75', specialist: 'Specialist actions', specialistOption: 'Allow specialist-only actions',
    delete: 'Delete profile', save: 'Save profile', saved: 'Saved',
  },
  solver: solverEn,
  settings: {
    title: 'Cosmic Settings',
    description: "Adjust your Frozen Rabbit's Cosmic preferences",
    appearanceTitle: 'Appearance',
    appearanceDescription: 'Customize the visual style of the application',
    darkMode: 'Dark mode',
    darkModeDescription: 'Switch to a dark theme for a better night-time experience',
    languageTitle: 'Language',
    languageDescription: 'Display language for the website. English will be shown if translations are missing.',
    dataSourcesTitle: 'Sources & Acknowledgements',
    dataSourcesDescription: 'Thanks to these projects for the solver backbone, mission, recipe, and game icon data',
    sources: {
      artisan: 'Primary source of the solver backbone',
      teamcraft: 'Mission and recipe data',
      xivapi: 'Game item and action icons',
    },
  },
  faq: {
    description: 'Frequently asked questions about Frozen Rabbit\'s Cosmic',
    rabbitQuestion: 'Why freeze the rabbit? Can I roast it instead?',
    rabbitAnswer: 'No.',
    algorithmQuestion: 'How does the solver algorithm work?',
    algorithmAnswer: "The v2.4 solver builds on Artisan's Expert Solver, combining full-quality finishing routes, comparisons of possible outcomes, and mission time estimates. Each recommendation follows the results you report. Read the detailed explanation {guide}.",
    algorithmLink: "here",
    optimalQuestion: "Does this website's solver produce the optimal solution?",
    optimalAnswer: 'The backbone is an experimentally tested, capable decision-tree algorithm; it does not produce an optimal solution through brute-force enumeration.',
    integrationQuestion: "Can I integrate this website's solver into my project?",
    integrationAnswer: "See the {guide} for integration instructions. Artisan's BSD license terms remain in effect, and your implementation must also include this project's MIT license.",
    integrationGuideLink: 'GitHub guide',
    footer: 'Have more questions? Feel free to report on GitHub or email: {email}',
  },
  algorithm: {
    "back": "Back to FAQ",
    "version": "Solver v2.4",
    "title": "How does the solver choose your next action?",
    "intro": "In an expert craft, one failed action or a helpful condition can change what comes next. The solver uses your gear, recipe, and each result you report to choose an action for the situation you're in.",
    "priority": "Make the most of durability and CP to produce valuable quality, while considering faster ways to finish when mission time is running short.",
    "foundation": {
      "title": "Built on Artisan's crafting decisions",
      "first": "The solver builds on Artisan's Expert Solver. It checks progress, quality, durability, CP, and active effects to decide when to advance synthesis, raise quality, recover durability, or wait for a helpful condition.",
      "second": "It then looks for a suitable finishing sequence and, in certain situations, compares how other actions might work out before recommending your next move."
    },
    "finish": {
      "title": "Finding a full-quality finish",
      "first": "Near the end of a craft, one more Touch might reach maximum quality but leave too little durability to finish. The solver considers progress, quality, and costs together, looking for a sequence that achieves both. It can include actions that recover durability or reduce consumption.",
      "second": "Alongside short sequences, it tries finishing routes of up to 12 actions and checks the conditions that could follow under the crafting rules. When it finds a route that works across those conditions, it recommends the first action, then checks whether to continue after your next report."
    },
    "compare": {
      "title": "Looking at alternatives to waiting",
      "first": "Sometimes waiting for a useful condition or taking a chance on an action is the original recommendation. For recipes that require maximum quality, if there is no verified finish yet, the solver also compares using another guaranteed-success action first, followed by Artisan's decisions.",
      "second": "It simulates several continuations, including a more even mix of conditions and a mix with more Normal conditions. It switches when neither mix loses completed or maximum-quality crafts and the alternative produces enough additional maximum-quality results. These simulations help compare choices; you still report the condition that actually appears."
    },
    "opening": {
      "title": "Planning durability recovery earlier",
      "first": "Manipulation restores durability over subsequent actions, but costs CP up front. After Reflect, the solver compares using it now with continuing synthesis or waiting, so it may recommend Manipulation earlier in the craft.",
      "second": "There is a trade-off: the current helpful condition may pass, and less CP will remain for other actions. The solver carries those costs into its simulations. It chooses early Manipulation when the comparison supports it, the action is available, and its effect is not already active."
    },
    "shortFinish": {
      "title": "v2.4: fewer actions for a full-quality finish",
      "first": "When a full-quality finishing route is already available, or quality is already full, the solver looks for a shorter route. It only recommends that route's first action after checking that it can still complete the craft at full quality.",
      "second": "This adjustment also works without a mission timer. It can remove some unnecessary actions, but only checks a limited set of combinations, so it does not always find the shortest possible route."
    },
    "time": {
      "title": "Considering less waiting when time is short",
      "first": "For timed missions, the background time estimate starts with your first condition report, with no manual calibration. The website assumes one craft per item, sets aside some time, and divides the remainder equally among unfinished items. Undoing an action or switching items keeps the same countdown. “Craft again” returns the current item to step one with the same equipment and keeps the countdown running. “Reset mission” reopens item and equipment selection; confirming clears mission progress and resets the countdown to start with your first condition report. Closing the panel preserves progress and timing.",
      "second": "With enough time, the solver keeps its usual quality-first approach. If time looks tight, it also compares spending CP to recover durability and reduce waiting, aiming to deliver something valuable before the deadline. These simulated trade-offs can affect final quality and cannot guarantee an on-time finish. This background estimate guides recommendations; use the in-game timer for the actual time remaining."
    },
    "feedback": {
      "title": "Continuing from your actual result",
      "first": "After each report of success or failure and the next condition, the solver updates your remaining resources and effects before choosing again. The same recipe and gear can lead to different sequences when the results along the way differ.",
      "second": "If you use another legal action, simply report what you used. The solver continues from the new state and checks any planned finish again, so you don't need to force the craft back onto an earlier recommendation."
    },
    "limits": {
      "title": "How gear and conditions affect the outcome",
      "first": "Your gear determines the progress and quality gained from actions and the CP available to spend. Conditions change an action's effects and costs. A run of unfavorable conditions or failed actions can leave resources tight, even after a promising opening.",
      "second": "The solver looks for good choices using the state it knows, but cannot predict the next condition. To keep each recommendation timely, it also searches only some of the possible sequences. Better routes may exist, and some crafts can still end in failure."
    },
    "sourceIntro": "Thanks to Artisan for the expert-crafting solver this work builds on.",
    "sourceLink": "View the original Artisan project"
  },
  welcome: {
    title: "Welcome to Frozen Rabbit's Cosmic",
    subtitle: 'Choose your preferred language before you begin',
    confirm: 'Start with this language',
  },
  sponsor: {
    title: "Support Frozen Rabbit's Cosmic",
    description: 'Thank you for your support! Players in Taiwan can use ECPay, while overseas players can use Ko-fi. Questions: {email}',
    twProvider: 'Taiwan (ECPay)',
    twDescription: 'Supports local cards, ATM, and convenience-store payments.',
    globalProvider: 'Global (Ko-fi / PayPal)',
    globalDescription: 'For overseas supporters using cards or PayPal.',
    note: 'Every contribution helps keep the rabbit frozen.',
  },
}
