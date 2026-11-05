export type Chapter = { heading: string; text: string };
export type QuizQ = { question: string; options: string[]; answerIndex: number; explanation: string };

export type Story = {
  id: string;
  title: string;
  figure: string;
  era: string;
  years: string;
  summary: string;
  minutes: number;
  tier: "free" | "pro";
  color: string;
  initials: string;
  image?: string;
  trait: string;
  chapters: Chapter[];
  quiz: QuizQ[];
};

import cleopatraImg from "./assets/cleopatra.webp";
import caesarImg from "./assets/caesar.webp";
import genghisImg from "./assets/genghis.webp";
import joanImg from "./assets/joan.webp";
import leonardoImg from "./assets/leonardo.webp";
import tubmanImg from "./assets/tubman.webp";
import lincolnImg from "./assets/lincoln.webp";
import teslaImg from "./assets/tesla.webp";
import curieImg from "./assets/curie.webp";
import kahloImg from "./assets/kahlo.webp";

export const ERAS = ["All", "Ancient World", "Medieval", "Renaissance", "Modern Era"] as const;

export const STORIES: Story[] = [
  {
    id: "cleopatra",
    title: "Cleopatra: The Queen Who Outplayed Rome",
    figure: "Cleopatra VII",
    era: "Ancient World",
    years: "69–30 BC · Egypt",
    summary: "Egypt's last pharaoh spoke nine languages and negotiated with Rome's most powerful men as an equal.",
    minutes: 5,
    tier: "free",
    color: "#9A6B2F",
    initials: "C",
    image: cleopatraImg,
    trait: "Diplomat & strategist",
    chapters: [
      { heading: "A throne shared, a throne lost", text: "Cleopatra became queen of Egypt in 51 BC at about eighteen, ruling alongside her younger brother Ptolemy XIII, as custom demanded. The partnership collapsed into civil war, and Cleopatra was driven from Alexandria. Her kingdom was rich — Egypt's grain fed much of the Mediterranean — but Rome's shadow loomed over everything." },
      { heading: "The carpet audience", text: "In 48 BC Julius Caesar arrived in Alexandria chasing his rival Pompey. According to the famous account, Cleopatra had herself smuggled into the palace rolled inside a carpet (some sources say a linen sack) and unrolled before Caesar. The gamble worked: Caesar backed her claim, and after a war in Alexandria, Ptolemy XIII died and Cleopatra was restored to the throne." },
      { heading: "Nine languages, one kingdom", text: "Unlike the Greek-speaking rulers before her, Cleopatra learned Egyptian and presented herself as the goddess Isis reborn. Plutarch wrote that she could speak to Ethiopians, Troglodytes, Hebrews, Arabians, Syrians, Medes and Parthians in their own tongues. Language was her weapon: she negotiated directly, without interpreters, in a world of empires." },
      { heading: "Antony, Actium, and the end", text: "After Caesar's assassination, Cleopatra allied with Mark Antony, both politically and personally; they had three children together. In 31 BC their forces lost the Battle of Actium to Octavian, Caesar's heir. As Octavian marched on Alexandria in 30 BC, Antony and then Cleopatra took their own lives. Egypt became a Roman province, ending three thousand years of pharaonic rule." },
    ],
    quiz: [
      { question: "How was Cleopatra famously smuggled in to meet Julius Caesar?", options: ["In a grain ship", "Rolled inside a carpet", "Disguised as a priest", "Hidden in a chariot"], answerIndex: 1, explanation: "Ancient accounts say she was carried into the palace rolled in a carpet or linen sack and unrolled before Caesar." },
      { question: "What made Cleopatra unusual among Egypt's Greek-speaking rulers?", options: ["She never left Alexandria", "She refused Roman trade", "She learned Egyptian and many other languages", "She built the Library of Alexandria"], answerIndex: 2, explanation: "She learned Egyptian and reportedly spoke nine languages, negotiating with foreign envoys directly." },
      { question: "Which battle sealed Cleopatra and Antony's fate in 31 BC?", options: ["Actium", "Cannae", "Philippi", "Alesia"], answerIndex: 0, explanation: "Octavian's victory at the naval Battle of Actium in 31 BC led to the fall of Alexandria the next year." },
    ],
  },
  {
    id: "caesar",
    title: "Julius Caesar: The General Who Remade Rome",
    figure: "Julius Caesar",
    era: "Ancient World",
    years: "100–44 BC · Rome",
    summary: "Conqueror of Gaul, author, reformer — and the man whose ambition broke the Roman Republic.",
    minutes: 5,
    tier: "free",
    color: "#7F1D1D",
    initials: "JC",
    image: caesarImg,
    trait: "General & reformer",
    chapters: [
      { heading: "An ambitious young Roman", text: "Born in 100 BC into a respected but not especially rich family, Gaius Julius Caesar climbed Rome's political ladder with dazzling speed and enormous borrowed money. He was charismatic, ruthless, and a brilliant speaker. By 60 BC he formed the First Triumvirate — an informal alliance with Pompey and Crassus, the two most powerful men in Rome." },
      { heading: "The conquest of Gaul", text: "As governor of Gaul from 58 BC, Caesar spent nearly a decade conquering the peoples of modern France and Belgium, and twice crossed into Britain. His victories made him fabulously wealthy and adored by his legions. He wrote his own account of the wars, the Commentaries — history written by its main character, in the third person." },
      { heading: "Crossing the Rubicon", text: "In 49 BC the Senate, now led by Pompey, ordered Caesar to disband his army and return as a private citizen — which would leave him open to prosecution. Instead, on January 10, he crossed the Rubicon river with his legion, an act of civil war. Tradition gives him the words 'the die is cast.' Within two years he had defeated Pompey's forces across the Mediterranean world." },
      { heading: "Dictator, reforms, and the Ides of March", text: "As dictator, Caesar reformed the calendar — the Julian calendar, ancestor of ours — extended citizenship, and planned vast public works. But in February 44 BC he was named dictator for life, and senators who feared a king conspired against him. On the Ides of March, March 15, 44 BC, he was stabbed 23 times in the Senate. His heir, Octavian, would become Augustus, the first emperor." },
    ],
    quiz: [
      { question: "What river did Caesar cross in 49 BC, starting a civil war?", options: ["The Tiber", "The Rubicon", "The Rhine", "The Nile"], answerIndex: 1, explanation: "Crossing the Rubicon with his army in January 49 BC was an act of war against the Senate." },
      { question: "Which calendar reform is named after Caesar?", options: ["The Gregorian calendar", "The lunar calendar", "The Julian calendar", "The Republican calendar"], answerIndex: 2, explanation: "The Julian calendar, introduced in 45 BC, is the direct ancestor of the calendar used today." },
      { question: "On what date was Caesar assassinated?", options: ["March 15, 44 BC", "January 10, 49 BC", "December 25, 45 BC", "July 12, 100 BC"], answerIndex: 0, explanation: "He was stabbed 23 times on the Ides of March — March 15, 44 BC." },
    ],
  },
  {
    id: "genghis",
    title: "Genghis Khan: From Outcast to Empire",
    figure: "Genghis Khan",
    era: "Medieval",
    years: "c. 1162–1227 · Mongolia",
    summary: "An outcast boy named Temüjin united the Mongol tribes and built the largest land empire in history.",
    minutes: 6,
    tier: "pro",
    color: "#3F6212",
    initials: "GK",
    image: genghisImg,
    trait: "Unifier & conqueror",
    chapters: [
      { heading: "A hard beginning", text: "Temüjin was born around 1162 on the Mongolian steppe. When he was about nine, his father, a tribal chief, was poisoned by rivals, and the clan abandoned the family. They survived on wild foods in near-starvation. As a young man Temüjin was even captured and enslaved for a time before escaping — an education in how fragile life without allies could be." },
      { heading: "Uniting the tribes", text: "Through shifting alliances, marriages, and war, Temüjin spent two decades uniting the feuding Mongol and Turkic tribes. He broke with tradition by promoting men for skill and loyalty rather than birth. In 1206 a great assembly, a kurultai, proclaimed him Genghis Khan — ruler of all the peoples of the felt tents." },
      { heading: "An army like a machine", text: "Mongol armies were organized in decimal units of ten, a hundred, a thousand, and ten thousand, with discipline enforced absolutely. Horse archers could shoot accurately at full gallop, and feigned retreats lured enemies into traps. With Chinese engineers they mastered siege warfare too. In 1211–1215 they conquered the Jin dynasty of northern China; in 1219–1221 they overran the Khwarezmian Empire in Persia." },
      { heading: "The empire after him", text: "Genghis Khan died in 1227 during a campaign in western Xia; his burial place remains unknown. His empire — eventually stretching from China to eastern Europe, the largest contiguous land empire ever — was divided among his sons and grandsons. It secured trade routes across Eurasia and connected East and West, at a staggering human cost in the cities that resisted." },
    ],
    quiz: [
      { question: "What was Genghis Khan's birth name?", options: ["Ögedei", "Temüjin", "Kublai", "Batu"], answerIndex: 1, explanation: "He was born Temüjin and proclaimed Genghis Khan in 1206 after uniting the tribes." },
      { question: "How did Genghis Khan break with tradition when building his forces?", options: ["He used only family members as officers", "He banned horses", "He promoted by skill and loyalty, not birth", "He fought only in winter"], answerIndex: 2, explanation: "Merit and loyalty over birth was a radical break — and a key to his armies' effectiveness." },
      { question: "What is remarkable about Genghis Khan's empire geographically?", options: ["It was the largest contiguous land empire in history", "It was entirely on islands", "It never included China", "It lasted only one year"], answerIndex: 0, explanation: "At its height under his successors it stretched from China to eastern Europe — the largest land empire ever." },
    ],
  },
  {
    id: "joan",
    title: "Joan of Arc: The Peasant Who Led an Army",
    figure: "Joan of Arc",
    era: "Medieval",
    years: "c. 1412–1431 · France",
    summary: "A teenage peasant girl convinced a prince to give her an army — and turned the tide of the Hundred Years' War.",
    minutes: 5,
    tier: "pro",
    color: "#1E3A5F",
    initials: "JA",
    image: joanImg,
    trait: "Visionary & soldier",
    chapters: [
      { heading: "Voices in a war-torn country", text: "Joan was born around 1412 in Domrémy, a village in northeastern France, during the Hundred Years' War between France and England. Much of northern France, including Paris, was under English or Burgundian control, and the French crown prince, Charles, had never been crowned. From about thirteen, Joan said she heard the voices of saints instructing her to drive out the English and take Charles to Reims for his coronation." },
      { heading: "The test at Chinon", text: "In 1429, at about seventeen, Joan traveled to the court at Chinon. By her account, she picked Charles out of the crowd though he was disguised among his courtiers — a moment that became legend. After theologians examined her, Charles gave her troops and sent her with a relief army to the besieged city of Orléans." },
      { heading: "Orléans and the road to Reims", text: "Joan arrived at Orléans in April 1429 wearing armor and carrying a banner. Within about nine days the English lifted the siege — her first and defining victory. French forces then cleared the Loire valley, and Joan escorted Charles through enemy territory to Reims, where he was crowned King Charles VII on July 17, 1429, with Joan standing nearby." },
      { heading: "Capture, trial, and canonization", text: "In May 1430 Joan was captured by Burgundian forces at Compiègne and sold to the English. She was put on trial for heresy in Rouen, presided over by a pro-English bishop, and burned at the stake on May 30, 1431, at about nineteen. A later retrial nullified the verdict, and in 1920 the Catholic Church canonized her as a saint." },
    ],
    quiz: [
      { question: "Which besieged city did Joan help relieve in 1429?", options: ["Paris", "Orléans", "Rouen", "Calais"], answerIndex: 1, explanation: "The lifting of the siege of Orléans in May 1429 was her defining first victory." },
      { question: "Why was Charles VII's coronation at Reims so important?", options: ["It ended the war immediately", "It made France an empire", "A crowned, anointed king strengthened his claim to rule France", "It was held in England"], answerIndex: 2, explanation: "Coronation at Reims, the traditional site, legitimized Charles as France's rightful king." },
      { question: "In what year was Joan canonized as a saint?", options: ["1920", "1456", "1431", "1803"], answerIndex: 0, explanation: "Joan was canonized by the Catholic Church in 1920, nearly five centuries after her death." },
    ],
  },
  {
    id: "leonardo",
    title: "Leonardo: The Mind That Drew the Future",
    figure: "Leonardo da Vinci",
    era: "Renaissance",
    years: "1452–1519 · Italy & France",
    summary: "Painter of the Mona Lisa, anatomist, engineer — Leonardo's notebooks hold five centuries of curiosity.",
    minutes: 6,
    tier: "free",
    color: "#5B4A2F",
    initials: "L",
    image: leonardoImg,
    trait: "Artist & inventor",
    chapters: [
      { heading: "The apprentice from Vinci", text: "Leonardo was born in 1452 near Vinci in Tuscany, the son of a notary and a peasant woman, and received little formal schooling. At about fourteen he was apprenticed to Andrea del Verrocchio in Florence, one of the great workshops of the Renaissance, where he learned painting, sculpture, and mechanics side by side." },
      { heading: "Milan and the Last Supper", text: "In the 1480s Leonardo offered his services to Ludovico Sforza, ruler of Milan — advertising himself first as a military engineer who could also paint. In Milan he painted The Last Supper on a refectory wall in the 1490s. Its experimental technique began deteriorating within decades, yet its composition — the apostles reacting in waves of emotion at one announcement — changed Western art." },
      { heading: "Notebooks of everything", text: "Leonardo filled thousands of notebook pages, written in mirror script, with studies of anatomy (from dissections he performed), flowing water, birds in flight, optics, geology, and machines — flying devices, armored vehicles, and diving gear, most never built. For him painting was a science: to depict the world truthfully, he first had to understand how it worked." },
      { heading: "The Mona Lisa and final years", text: "Back in Florence in the early 1500s he began the Mona Lisa, carrying it with him and refining it for years. In 1516 the French king Francis I invited him to France, giving him the manor of Clos Lucé near Amboise, where Leonardo died in 1519. He left relatively few finished paintings — and an ocean of ideas that took centuries to catch up with." },
    ],
    quiz: [
      { question: "In Verrocchio's Florence workshop, Leonardo was trained as what?", options: ["A banker", "An apprentice artist and craftsman", "A shipwright", "A monk"], answerIndex: 1, explanation: "He apprenticed in a Renaissance workshop where painting, sculpture, and mechanics were taught together." },
      { question: "How did Leonardo write in his notebooks?", options: ["In Latin code", "Only in drawings", "In mirror script", "In Greek"], answerIndex: 2, explanation: "His famous notebooks are written in mirror handwriting, readable in a mirror." },
      { question: "Which king gave Leonardo his final home in France?", options: ["Francis I", "Henry VIII", "Lorenzo de' Medici", "Charles V"], answerIndex: 0, explanation: "Francis I settled Leonardo at Clos Lucé near Amboise in 1516, where he died in 1519." },
    ],
  },
  {
    id: "tubman",
    title: "Harriet Tubman: Conductor of the Underground Railroad",
    figure: "Harriet Tubman",
    era: "Modern Era",
    years: "c. 1822–1913 · United States",
    summary: "She escaped slavery, then went back — again and again — to guide dozens more to freedom.",
    minutes: 5,
    tier: "pro",
    color: "#4A3728",
    initials: "HT",
    image: tubmanImg,
    trait: "Abolitionist & scout",
    chapters: [
      { heading: "Born enslaved", text: "Harriet Tubman was born Araminta Ross around 1822, enslaved in Maryland. As a teenager she suffered a severe head injury when an overseer threw a heavy weight that struck her; she lived with its effects — seizures and vivid dreams she understood as religious visions — for the rest of her life. In 1844 she married John Tubman, a free Black man." },
      { heading: "Escape — and return", text: "In 1849, fearing she would be sold, Tubman escaped to Philadelphia, following the North Star and aided by the secret network called the Underground Railroad. She later said that when she crossed into freedom she looked at her hands to see if she was the same person — and then decided to go back for her family. Over the next decade she made some thirteen trips south, guiding about seventy people to freedom." },
      { heading: "'Moses' of her people", text: "Tubman carried a pistol, used disguises, and famously never lost a passenger. Enslavers offered large rewards for her capture, never knowing the small woman they sought was the celebrated 'Moses.' She also sheltered and advised John Brown before his 1859 raid, though illness kept her from joining it." },
      { heading: "Spy, scout, and liberator", text: "During the Civil War, Tubman served the Union Army in South Carolina as a cook, nurse, scout, and spy, using her network of enslaved informants. In June 1863 she helped guide the Combahee Ferry raid, which freed more than 700 enslaved people — often cited as making her the first woman to lead an armed assault in the war. She died in 1913 in Auburn, New York, in the home for the elderly poor she had founded." },
    ],
    quiz: [
      { question: "Roughly how many rescue trips did Tubman make back into the slaveholding South?", options: ["About 13", "2", "Over 100", "She never returned"], answerIndex: 0, explanation: "She made some thirteen trips over a decade, guiding about seventy people to freedom." },
      { question: "What was Tubman's famous nickname?", options: ["The General", "Moses", "The Conductor General", "Liberty"], answerIndex: 1, explanation: "She was called 'Moses' for leading her people out of bondage, like the biblical figure." },
      { question: "What did the 1863 Combahee Ferry raid accomplish?", options: ["It ended the Civil War", "It freed more than 700 enslaved people", "It captured Richmond", "It freed one family"], answerIndex: 1, explanation: "The raid Tubman helped guide freed more than 700 enslaved people in South Carolina." },
    ],
  },
  {
    id: "lincoln",
    title: "Lincoln: Holding a Nation Together",
    figure: "Abraham Lincoln",
    era: "Modern Era",
    years: "1809–1865 · United States",
    summary: "A self-taught lawyer from a log cabin who preserved the Union and ended American slavery.",
    minutes: 6,
    tier: "free",
    color: "#334155",
    initials: "AL",
    image: lincolnImg,
    trait: "Statesman & orator",
    chapters: [
      { heading: "From log cabin to law office", text: "Abraham Lincoln was born in 1809 in a Kentucky log cabin and grew up in Indiana and Illinois with little formal schooling — by his own account, less than a year in total. He educated himself by borrowing books, worked as a store clerk, rail-splitter, and surveyor, studied law on his own, and was admitted to the bar in 1836. He served one term in Congress and became a leading Illinois trial lawyer." },
      { heading: "'A house divided'", text: "The 1854 Kansas–Nebraska Act, which allowed slavery to expand into new territories, pulled Lincoln back into politics. In 1858 he challenged Senator Stephen Douglas for the Senate; their famous debates made Lincoln nationally known, though he lost. Accepting the nomination he had declared, 'A house divided against itself cannot stand' — the Union, he argued, could not endure permanently half slave and half free." },
      { heading: "Civil war and emancipation", text: "Elected president in 1860, Lincoln saw seven Southern states secede before his inauguration, and war began in April 1861. On January 1, 1863, he issued the Emancipation Proclamation, declaring freedom for enslaved people in the rebellious states and making abolition a war aim. That November, at the dedication of the Gettysburg cemetery, he delivered in about two minutes the address that redefined the war as a struggle for a 'new birth of freedom.'" },
      { heading: "Victory — and April 1865", text: "Re-elected in 1864, Lincoln pushed the Thirteenth Amendment through Congress, abolishing slavery nationwide; it passed in January 1865. General Lee surrendered on April 9, 1865. Five days later, on April 14, Lincoln was shot by John Wilkes Booth at Ford's Theatre in Washington and died the next morning — the first American president to be assassinated." },
    ],
    quiz: [
      { question: "What did the Emancipation Proclamation do on January 1, 1863?", options: ["Ended the war", "Freed enslaved people in the rebellious states", "Gave Lincoln a second term", "Banned slavery in every state immediately"], answerIndex: 1, explanation: "It declared freedom for enslaved people in states in rebellion and made abolition a Union war aim." },
      { question: "How long is the Gettysburg Address, roughly?", options: ["Two hours", "Twenty minutes", "About two minutes", "A full day"], answerIndex: 2, explanation: "At about 270 words, Lincoln's Gettysburg Address takes roughly two minutes to deliver." },
      { question: "Which amendment abolished slavery nationwide?", options: ["The First", "The Thirteenth", "The Fifteenth", "The Nineteenth"], answerIndex: 1, explanation: "The Thirteenth Amendment, passed by Congress in January 1865 and ratified that December, abolished slavery across the United States." },
    ],
  },
  {
    id: "tesla",
    title: "Nikola Tesla: The Wizard of Alternating Current",
    figure: "Nikola Tesla",
    era: "Modern Era",
    years: "1856–1943 · Serbia & United States",
    summary: "His AC system lights the world to this day — but the fame and fortune went to others.",
    minutes: 5,
    tier: "free",
    color: "#3730A3",
    initials: "NT",
    image: teslaImg,
    trait: "Inventor & visionary",
    chapters: [
      { heading: "A mind that built machines in pictures", text: "Nikola Tesla was born in 1856 in Smiljan, in present-day Croatia, to a Serbian family. He claimed he could visualize a machine completely in his mind, run it mentally to find the wear, and only then build it. After engineering studies in Graz and work in Budapest and Paris, he emigrated to New York in 1884 with four cents and a letter of introduction to Thomas Edison." },
      { heading: "The war of the currents", text: "Tesla championed alternating current (AC), which can travel long distances at high voltage; Edison defended direct current (DC) and his business empire built on it. Their rivalry became the 'war of the currents,' with Edison's side staging public electrocutions of animals using AC to frighten the public. George Westinghouse backed Tesla's system, and AC won decisively when the Westinghouse company lit the 1893 Chicago World's Fair." },
      { heading: "Niagara and the modern grid", text: "Tesla's polyphase AC patents powered the great Niagara Falls generating project, which began sending power to Buffalo in 1896 — the birth of the modern electrical grid. Tesla himself moved on to high-frequency experiments in Colorado Springs and then to Wardenclyffe Tower on Long Island, an attempt at worldwide wireless power and communication that ran out of funding and was demolished in 1917." },
      { heading: "The prophet in the hotel room", text: "Tesla foresaw smartphones, worldwide wireless communication, and renewable energy with eerie accuracy, but he was a poor businessman and tore up a lucrative royalty contract to save Westinghouse during a financial panic. He died in 1943, alone in room 3327 of the Hotel New Yorker. The unit of magnetic flux density — the tesla — and a certain electric car company now carry his name." },
    ],
    quiz: [
      { question: "What did Tesla champion against Edison's direct current?", options: ["Alternating current (AC)", "Steam power", "Gas lighting", "Hydraulic power"], answerIndex: 0, explanation: "Tesla's AC system could transmit power over long distances, which is why it became the world standard." },
      { question: "Which event showcased AC power's victory in 1893?", options: ["The Paris Exposition", "The Chicago World's Fair lighting", "The opening of the subway", "The Niagara dam collapse"], answerIndex: 1, explanation: "Westinghouse used Tesla's AC system to light the 1893 World's Columbian Exposition in Chicago." },
      { question: "What landmark power project sent electricity to Buffalo in 1896?", options: ["Hoover Dam", "Niagara Falls generation", "Wardenclyffe Tower", "The Colorado Springs lab"], answerIndex: 1, explanation: "Tesla's polyphase AC patents powered the Niagara Falls project, the birth of the modern grid." },
    ],
  },
  {
    id: "curie",
    title: "Marie Curie: Twice a Nobel Laureate",
    figure: "Marie Skłodowska Curie",
    era: "Modern Era",
    years: "1867–1934 · Poland & France",
    summary: "She discovered two elements, coined the word 'radioactivity,' and remains the only person to win Nobel Prizes in two sciences.",
    minutes: 5,
    tier: "pro",
    color: "#3F6212",
    initials: "MC",
    image: curieImg,
    trait: "Physicist & pioneer",
    chapters: [
      { heading: "Education against the rules", text: "Maria Skłodowska was born in 1867 in Warsaw, then under Russian rule, where women were barred from university. She studied at the clandestine 'Flying University' and worked as a governess to fund her sister's medical studies in Paris — with a pact that her sister would then fund hers. In 1891 she moved to Paris, enrolled at the Sorbonne, and often fainted from hunger while studying physics and mathematics." },
      { heading: "A shed, tons of pitchblende, two new elements", text: "Marie married physicist Pierre Curie in 1895 and chose the mysterious rays discovered in uranium as her research topic, coining the term 'radioactivity.' Suspecting an unknown element in pitchblende ore, the Curies processed tons of it in a drafty shed. In 1898 they announced two new elements: polonium, named for Marie's occupied homeland, and radium." },
      { heading: "Two Nobel Prizes", text: "In 1903 Marie and Pierre shared the Nobel Prize in Physics with Henri Becquerel — Marie was the first woman Nobel laureate. Pierre was killed by a horse-drawn wagon in a Paris street in 1906; Marie took over his professorship, the Sorbonne's first woman professor. In 1911 she won the Nobel Prize in Chemistry, making her the only person ever to win Nobels in two different sciences." },
      { heading: "The little Curies — and the cost", text: "During the First World War, Marie developed mobile X-ray units — the 'petites Curies' — and drove them to the front herself, training women operators and helping locate shrapnel in wounded soldiers. Decades of radiation exposure, carried in test tubes in her pockets and unshielded in the lab, destroyed her health; she died in 1934 of aplastic anemia. Her notebooks remain radioactive and are stored in lead-lined boxes." },
    ],
    quiz: [
      { question: "What were the two elements the Curies announced in 1898?", options: ["Uranium and thorium", "Polonium and radium", "Plutonium and radon", "Helium and neon"], answerIndex: 1, explanation: "Polonium — named for Poland — and radium were extracted from pitchblende through years of grinding work." },
      { question: "What record does Marie Curie still hold?", options: ["Most patents by a woman", "Only person to win Nobel Prizes in two different sciences", "First woman to fly solo", "Longest-serving professor"], answerIndex: 1, explanation: "She won the Physics prize in 1903 and the Chemistry prize in 1911 — a feat no one else has matched across two sciences." },
      { question: "What were the 'petites Curies'?", options: ["Her laboratory notebooks", "Scholarships for girls", "Mobile X-ray units used at the front in WWI", "A type of radium watch"], answerIndex: 2, explanation: "The 'little Curies' were mobile X-ray units Curie developed and helped operate near the battlefront." },
    ],
  },
  {
    id: "kahlo",
    title: "Frida Kahlo: Pain Into Paint",
    figure: "Frida Kahlo",
    era: "Modern Era",
    years: "1907–1954 · Mexico",
    summary: "Confined to bed for months after a devastating accident, she turned a mirror on herself — and changed art.",
    minutes: 5,
    tier: "pro",
    color: "#9D174D",
    initials: "FK",
    image: kahloImg,
    trait: "Artist & icon",
    chapters: [
      { heading: "The accident that split her life", text: "Frida Kahlo was born in 1907 in Coyoacán, Mexico City, contracted polio at six, which left her right leg thinner, and was one of the few girls admitted to Mexico's elite National Preparatory School, aiming for medicine. In 1925, at eighteen, the bus she was riding was struck by a streetcar; an iron handrail pierced her body, fracturing her spine and pelvis. She would endure some thirty operations over her lifetime." },
      { heading: "Painting from the bed", text: "Confined to bed for months, Kahlo had a special easel rigged so she could paint lying down, with a mirror above her. 'I paint myself because I am so often alone,' she said, 'because I am the subject I know best.' Of her roughly 200 works, about a third are self-portraits — unflinching, symbolic, dressed in the Tehuana clothing of Mexico that became her signature." },
      { heading: "Marriage, fame abroad, neglect at home", text: "In 1929 Kahlo married the muralist Diego Rivera, twenty years her senior; their marriage was famously stormy, with a divorce and remarriage. Her work was celebrated abroad — a 1939 Paris exhibition and the first solo show by a Mexican artist at the Louvre's purchase — while in Mexico she was long treated as merely Rivera's wife. Her first solo exhibition in Mexico came only in 1953, a year before her death." },
      { heading: "Arriving by bed, leaving as legend", text: "By 1953 Kahlo was too ill to stand, so she attended her Mexican exhibition carried in on her four-poster bed, installed in the gallery — one of art history's great entrances. She died in 1954 at forty-seven. Recognition grew for decades afterward: her home, La Casa Azul, became a museum in 1958, and she is now among the most recognized artists in the world." },
    ],
    quiz: [
      { question: "What event at age eighteen changed Kahlo's life and art?", options: ["A bus and streetcar collision that fractured her spine", "Polio at age six was her only illness", "A fall from a scaffold", "An earthquake"], answerIndex: 0, explanation: "The 1925 crash left her with lifelong injuries and long bedridden recoveries, during which she began to paint." },
      { question: "How did Kahlo paint while confined to bed?", options: ["She dictated to assistants", "With an easel rigged over her bed and a mirror above", "She only sketched in pencil", "She painted on the ceiling"], answerIndex: 1, explanation: "A special easel and overhead mirror let her paint self-portraits while lying down." },
      { question: "How did Kahlo attend her first Mexican solo exhibition in 1953?", options: ["She refused to attend", "By radio from home", "Carried in on her four-poster bed, set up in the gallery", "In a wheelchair parade"], answerIndex: 2, explanation: "Too ill to stand, she was carried into the gallery in her bed — an entrance that became legend." },
    ],
  },
];

export const PATHS = [
  { id: "empires", name: "Empires & Conquerors", note: "Power, ambition, and the price of both", storyIds: ["cleopatra", "caesar", "genghis"] },
  { id: "minds", name: "Minds That Changed Everything", note: "Art and science ahead of their time", storyIds: ["leonardo", "tesla", "curie"] },
  { id: "courage", name: "Acts of Courage", note: "People who risked everything for others", storyIds: ["joan", "tubman", "lincoln", "kahlo"] },
];
