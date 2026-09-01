/* Content for the Diglio citizenship research tracker.
   Everything here is transcribed from the September 1, 2026 evidence
   checklist. Item keys are permanent — they are the primary key in
   Supabase, so renaming one orphans its saved status and notes. */

const CASE = {
  subject: 'Diglio, Giuseppe (Joseph)',
  born: 'Italy, 1892–1896 (unsettled)',
  died: 'December 1938, Belleville, Essex County, New Jersey',
  question: 'Did Giuseppe Diglio ever become an American?',
  statute: 'Article 3-bis(1)(c), Law 91/1992',
  objective:
    'Prove Joseph never naturalized, so he qualifies as an "exclusively Italian" grandparent.',
};

/* The one date the whole investigation pivots on. */
const PIVOT = {
  date: 'September 27, 1906',
  text: [
    'On September 27, 1906, federal law required every court that naturalized anyone to send duplicate records to the federal Bureau of Immigration and Naturalization. Those became the C-file series USCIS still holds. It is national — any court, any state, any county.',
    'Joseph turned 21 between 1914 and 1916. Any naturalization of his own is necessarily after 1906, which means it is in the USCIS index or it does not exist. The pending G-1041 is close to dispositive for Joseph himself.',
    "His father's naturalization, if real, would be before 1906. That is invisible to USCIS and requires county-level searching in New Jersey.",
  ],
  kicker: 'Two searches, not one. Only the second is labor-intensive.',
};

const NAME_VARIANTS = {
  given: ['Joseph', 'Giuseppe', 'Guiseppe', 'Josef', 'Jos.', 'Guiseppi'],
  surname: ['Diglio', 'DiGlio', 'Di Glio', "D'Iglio", 'Deglio', 'Digli', 'Diglia', 'Deglia'],
  father: ['Michael', 'Michele', 'Michel'],
  wildcards: ['Digl*'],
  birthYears: '1892 – 1896',
  birthNotes: [
    'Family tree says 1894.',
    '1900 census says April 1893.',
    'Ancestry public profile says August 15, 1895.',
  ],
  rule: 'Search surname-only plus birth year range, and first-name-only plus surname wildcard. Italian surnames in New Jersey records from this period are butchered constantly.',
};

/* Pivotal answers that change what is worth doing next. */
const FACTS = [
  {
    key: 'wwi_answer',
    label: 'WWI draft card — citizenship answer',
    help: 'The June 5, 1917 form asked the man directly. This is the hinge for everything downstream.',
    options: [
      { v: '', l: 'Not yet determined' },
      { v: 'alien', l: 'Alien', tone: 'good' },
      { v: 'declarant', l: 'Declared intention (first papers)', tone: 'warn' },
      { v: 'naturalized', l: 'Naturalized citizen', tone: 'bad' },
      { v: 'natural_born', l: 'Natural born citizen', tone: 'bad' },
      { v: 'notfound', l: 'Card not found after browsing correct boards', tone: 'warn' },
    ],
  },
  {
    key: 'census_1900',
    label: '1900 census — naturalization column, as read from the image',
    help: 'Al = alien. Pa = first papers only, which is not naturalization at all. Na = naturalized.',
    options: [
      { v: '', l: 'Not yet re-read' },
      { v: 'al', l: 'Al — alien', tone: 'good' },
      { v: 'pa', l: 'Pa — first papers only', tone: 'good' },
      { v: 'na', l: 'Na — naturalized', tone: 'bad' },
      { v: 'illegible', l: 'Illegible', tone: 'warn' },
    ],
  },
  {
    key: 'census_1920',
    label: '1920 census — naturalization column for Joseph',
    help: 'The 1920 schedule also records year of naturalization. A blank there is affirmative.',
    options: [
      { v: '', l: 'Not yet located' },
      { v: 'al', l: 'Al — alien', tone: 'good' },
      { v: 'pa', l: 'Pa — first papers only', tone: 'good' },
      { v: 'na', l: 'Na — naturalized', tone: 'bad' },
      { v: 'notfound', l: 'Household not found', tone: 'warn' },
    ],
  },
  {
    key: 'household_link',
    label: 'Is the Michael Digli household in Orange proven to be Joseph’s family?',
    help: 'Currently an unsourced member tree plus a name match. The entire risk assessment rests on it.',
    options: [
      { v: '', l: 'Unproven — inference only' },
      { v: 'proven', l: 'Proven by manifest or equivalent', tone: 'good' },
      { v: 'disproven', l: 'Disproven — wrong family', tone: 'bad' },
    ],
  },
  {
    key: 'comune',
    label: 'Comune of birth',
    help: 'Two independent sources must agree before writing. If they split, write to both.',
    options: [
      { v: '', l: 'Unresolved' },
      { v: 'atripalda', l: 'Atripalda', tone: 'neutral' },
      { v: 'santapaolina', l: 'Santa Paolina', tone: 'neutral' },
      { v: 'both', l: 'Split — writing to both', tone: 'warn' },
    ],
  },
];

const STEPS = [
  {
    id: 's1',
    num: '01',
    title: 'WWI draft registration card',
    tag: 'Free · tonight',
    lede: 'The only single document that can answer both questions at once.',
    blocks: [
      { t: 'p', v: 'The June 5, 1917 registration form asked the man directly whether he was (1) a natural born citizen, (2) a naturalized citizen, (3) an alien, or (4) had declared his intention. In his own registration.' },
      { t: 'p', v: 'If Joseph wrote "alien" at age 22, that brackets against the 1930 census "Al" and effectively kills the derivative-naturalization theory, because a man made a citizen through his father’s papers as a child would have said naturalized.' },
      { t: 'note', v: 'He is in the first registration. June 5, 1917 covered men born between June 6, 1886 and June 5, 1896. All three candidate birth years fall inside that window.' },
      { t: 'h', v: 'What you are reading for' },
      { t: 'p', v: 'The citizenship question on the card, plus the address, employer, and next of kin, which help confirm you have the right man.' },
      { t: 'warn', v: 'Record the result either way. A negative browse of the correct draft board is itself evidence worth documenting.' },
    ],
    links: [
      { l: 'FamilySearch collection 1968530 (free)', u: 'https://familysearch.org/search/collection/1968530' },
      { l: 'NARA background on the collection', u: 'https://www.archives.gov/research/military/ww1/draft-registration' },
    ],
    items: [
      { k: 's1.essex', l: 'Search surname Diglio, New Jersey, Essex County — no first name' },
      { k: 's1.state', l: 'Search surname only, statewide New Jersey' },
      { k: 's1.wild', l: 'Search wildcard Digl*, New Jersey' },
      { k: 's1.nation', l: 'Search nationwide, birth year 1892–1896, birthplace Italy' },
      { k: 's1.browse', l: 'Browse Essex County draft boards by hand — Orange and Bloomfield', h: 'Cards file by state, then city or county, then local board, then alphabetically. Tedious but finite.' },
      { k: 's1.read', l: 'Read and record the citizenship answer on the card' },
    ],
    facts: ['wwi_answer'],
  },
  {
    id: 's2',
    num: '02',
    title: '1910 and 1920 federal censuses',
    tag: 'Free · this weekend',
    lede: 'Neither is in the GEDCOM. Both carry a naturalization column.',
    blocks: [
      { t: 'p', v: 'Same values as 1930: Al (alien), Pa (first papers filed), Na (naturalized). In 1920 Joseph was roughly 25 and living in Orange.' },
      { t: 'note', v: 'The 1920 schedule also records year of naturalization when applicable, so a blank there is affirmative.' },
      { t: 'p', v: 'Target: Orange, Essex County, New Jersey. In 1910 he would be a teenager, likely still in his father’s household, which also gives you the father’s naturalization status in the same row block.' },
      { t: 'warn', v: 'Two more "Al" entries turn a single data point into a pattern. This is cheap and high value.' },
    ],
    links: [{ l: 'FamilySearch search (free)', u: 'https://www.familysearch.org/search/' }],
    items: [
      { k: 's2.1910find', l: '1910 — locate the household in Orange, Essex County' },
      { k: 's2.1910jos', l: '1910 — record Joseph’s naturalization column value' },
      { k: 's2.1910mic', l: '1910 — record Michael’s naturalization column value' },
      { k: 's2.1920find', l: '1920 — locate Joseph in Orange' },
      { k: 's2.1920col', l: '1920 — record naturalization column and year-of-naturalization column' },
    ],
    facts: ['census_1920'],
  },
  {
    id: 's3',
    num: '03',
    title: 'Re-read the 1900 census image at full resolution',
    tag: 'Free',
    lede: 'You have the citation. Do not trust the transcription.',
    blocks: [
      { t: 'p', v: 'Orange Ward 3, Essex NJ, ED 0161, roll 968, page 12. Household headed by Michael Digli with wife Sarrfina. Pull the actual image and zoom.' },
      { t: 'warn', v: 'Al, Pa and Na are easy to confuse in period script. Pa means first papers only, which is not naturalization at all. Compare the enumerator’s handwriting for the same letters across the entire page and the pages either side.' },
      { t: 'h', v: 'Why the "na" is probably wrong regardless' },
      { t: 'p', v: 'Under the law then in force, naturalization required five years of residence plus a declaration of intention filed at least two years earlier. A man who arrived in 1896 could not have been naturalized by June 1900. Either the column is misread or the immigration year is wrong. Both are common.' },
    ],
    links: [],
    items: [
      { k: 's3.image', l: 'Pull the actual image at full resolution' },
      { k: 's3.column', l: 'Read the naturalization column against the enumerator’s other letters' },
      { k: 's3.immyear', l: 'Record the immigration year column', h: 'Currently held as 1896.' },
      { k: 's3.births', l: 'Record month and year of birth for each person in the household' },
    ],
    facts: ['census_1900'],
  },
  {
    id: 's4',
    num: '04',
    title: '1899 passenger manifest',
    tag: 'Free',
    lede: 'The Orange household link is two shaky inferences stacked on each other.',
    blocks: [
      { t: 'warn', v: 'You have not actually proven that the Michael Digli household in Orange is Joseph’s family. It comes from an unsourced Ancestry member tree plus a name match — and your entire risk assessment currently rests on it.' },
      { t: 'p', v: 'The manifest shows who he traveled with and, critically, who he was joining in the US. If it lists a father Michael in Orange, the link is proven.' },
      { t: 'note', v: '1899 manifests are thinner than post-1906 ones. Fewer columns, less detail. Take what you get.' },
    ],
    links: [
      { l: 'FamilySearch — New York passenger lists, 1820–1957', u: 'https://www.familysearch.org/search/' },
    ],
    items: [
      { k: 's4.search', l: 'Search New York passenger lists, 1820–1957' },
      { k: 's4.ellis', l: 'Search the Ellis Island Foundation passenger database', h: 'Search for "Ellis Island passenger search" rather than guessing the URL — that site has moved before.' },
      { k: 's4.with', l: 'Record who he traveled with' },
      { k: 's4.joining', l: 'Record who he was joining in the US' },
    ],
    facts: ['household_link'],
  },
  {
    id: 's5',
    num: '05',
    title: 'Finish the USCIS sequence',
    tag: '$30 paid · pending',
    lede: 'G-1041 index search filed online April 2026. Result pending.',
    blocks: [
      { t: 'p', v: 'What comes back: a letter stating whether any record exists for the named person. If yes, it gives the file number and record series. If no, that letter is the evidence.' },
      { t: 'h', v: 'If it returns a file number' },
      { t: 'p', v: 'File Form G-1041A to get the actual file. Verify the fee before paying — G-1041A has run $65 for a copy, but $80 has also been quoted for certain copy formats, and USCIS fees have moved.' },
      { t: 'h', v: 'If it returns nothing' },
      { t: 'p', v: 'Reply in writing and ask explicitly for a no-record response suitable for submission to a foreign government. The consulate wants a certification, not a screenshot of a portal. Say so plainly in the request.' },
      { t: 'warn', v: 'One moving piece: on August 21, 2026, DHS published a proposed rule to shift genealogy program work for records already in NARA’s legal custody over to NARA. It is proposed, not final. But if the request stalls, that may be why, and the answer may become "ask NARA instead." Worth a check if you hear nothing by October.' },
    ],
    links: [
      { l: 'USCIS genealogy program', u: 'https://www.uscis.gov/genealogy' },
      { l: 'Form G-1041A', u: 'https://uscis.gov/g-1041a' },
      { l: 'DHS proposed rule, Aug 21 2026', u: 'https://www.federalregister.gov/documents/2026/08/21/2026-17119/genealogy-program-regulations-to-clarify-the-impact-of-federal-records-requirements' },
    ],
    items: [
      { k: 's5.filed', l: 'G-1041 index search filed — April 2026, $30' },
      { k: 's5.result', l: 'Index search result received' },
      { k: 's5.1041a', l: 'If a file number came back — file G-1041A', h: 'Verify the current fee on the form page first.' },
      { k: 's5.norecord', l: 'If nothing came back — request a certified no-record response for a foreign government' },
      { k: 's5.nara_rule', l: 'If silent by October — check whether the NARA transfer rule is the cause' },
    ],
  },
  {
    id: 's6',
    num: '06',
    title: 'Extend your NARA coverage',
    tag: 'Budget $50–150',
    lede: 'You have one court, one record type. A reviewer will notice.',
    blocks: [
      { t: 'p', v: 'What you have: a negative search letter covering Petitions for Naturalization, US District Court of New Jersey at Newark.' },
      { t: 'warn', v: 'Ask for it by name: a certification of non-existence of record. That is the form consulates accept. A plain email saying "we found nothing" is weaker.' },
      { t: 'p', v: 'The National Archives at New York City holds Record Group 21 for the District of New Jersey. Confirm the current contact through archives.gov rather than an old address, since NARA facility contacts change.' },
    ],
    links: [{ l: 'National Archives', u: 'https://www.archives.gov/' }],
    items: [
      { k: 's6.newark_pet', l: 'Petitions, D.NJ Newark — negative letter in hand' },
      { k: 's6.newark_dec', l: 'Declarations of Intention, D.NJ Newark' },
      { k: 's6.trenton', l: 'Both record types, Trenton division' },
      { k: 's6.camden', l: 'Both record types, Camden division' },
      { k: 's6.contact', l: 'Confirm current NARA New York City contact' },
    ],
  },
  {
    id: 's7',
    num: '07',
    title: 'Essex County pre-1906 naturalizations',
    tag: '$10 per search · ~$80 total',
    lede: 'The father question. This is where the labor is.',
    blocks: [
      { t: 'p', v: 'The New Jersey State Archives holds Essex County naturalization records for 1792 to 1931, which covers the entire window. They have an online search request form.' },
      { t: 'h', v: 'Terms' },
      { t: 'list', v: [
        '$10 per search — one county, one five-year span, includes up to five pages',
        'Additional pages $1.00 each',
        'Fee is non-refundable whether or not they find anything',
        'Result arrives as a non-certified PDF by email',
        'Certification available for an additional $25.00 per record',
      ] },
      { t: 'p', v: 'Only a naturalization while Joseph was still a minor matters. He turned 21 somewhere between 1914 and 1916, so the window is roughly 1899 to 1916. Search for Michael, Michele, Michel with all the surname variants.' },
      { t: 'note', v: 'The same four spans for Joseph himself are belt and suspenders. Post-1906 he should show in the USCIS index instead, but a county hit you did not know about would be a very bad surprise at the consulate.' },
      { t: 'p', v: 'If Essex comes up empty, the remaining gap is other courts he might have used — most likely Hudson County, also held by the State Archives, 1840–1948.' },
      { t: 'note', v: 'New Jersey State Archives: 609-292-6260' },
    ],
    links: [
      { l: 'NJ Archives naturalization record request form', u: 'https://wwwdnet-dos.nj.gov/DOS_ArchivesDBPortal/NaturalizationRecordRequest.aspx' },
      { l: 'Series CESCP005 collection guide (PDF)', u: 'https://nj.gov/state/archives/guides/cescp005.pdf' },
      { l: 'FamilySearch — NJ county naturalization records', u: 'https://www.familysearch.org/en/wiki/New_Jersey,_County_Naturalization_Records_-_FamilySearch_Historical_Records' },
      { l: 'Free NJ online naturalization records by county', u: 'https://theancestorhunt.com/blog/free-new-jersey-online-naturalization-records/' },
      { l: 'FamilySearch — NJ naturalization and citizenship', u: 'https://www.familysearch.org/en/wiki/New_Jersey_Naturalization_and_Citizenship' },
    ],
    items: [
      { k: 's7.free', l: 'Check the free FamilySearch digitized Essex records first', h: 'Do this before paying for anything.' },
      { k: 's7.m1899', l: 'Michael — 1899–1903' },
      { k: 's7.m1904', l: 'Michael — 1904–1908' },
      { k: 's7.m1909', l: 'Michael — 1909–1913' },
      { k: 's7.m1914', l: 'Michael — 1914–1918' },
      { k: 's7.j1899', l: 'Joseph — 1899–1903' },
      { k: 's7.j1904', l: 'Joseph — 1904–1908' },
      { k: 's7.j1909', l: 'Joseph — 1909–1913' },
      { k: 's7.j1914', l: 'Joseph — 1914–1918' },
      { k: 's7.hudson', l: 'Hudson County fallback, if Essex is empty', h: 'Also State Archives, 1840–1948. One more $10 search.' },
    ],
  },
  {
    id: 's8',
    num: '08',
    title: 'Vital records and the apostille chain',
    tag: '~$150 + apostille + translation',
    lede: 'Needed for the application regardless of what it says about citizenship.',
    blocks: [
      { t: 'p', v: 'Joseph died December 1938 in Belleville, Essex County. 1938 falls with the Office of Vital Statistics and Registry, not the State Archives — the Archives holds originals only through 1900 and microfilm through 1940 for in-person use.' },
      { t: 'warn', v: 'Critical, do not skip: on the application, indicate that the record will need an Apostille Seal. That gets you a certified copy bearing the original signature of the State Registrar or a Deputy, which is what the apostille process requires. If you order a normal certified copy you will have to order it again.' },
      { t: 'p', v: 'Then forward that certified copy to the New Jersey Department of Treasury, which issues the apostille. Italy is a Hague Convention country, so apostille is the right instrument.' },
      { t: 'note', v: 'New Jersey restricts certified copies to specified relatives. As Joseph’s grandson you qualify for his record. Bring proof of the relationship chain.' },
      { t: 'p', v: 'Every one of these needs to be certified, apostilled, and translated into Italian by an accepted translator. Track all three stages per document.' },
    ],
    links: [
      { l: 'Order NJ vital records', u: 'https://nj.gov/health/vital/order-vital/' },
      { l: 'CDC where-to-write, New Jersey', u: 'https://cdc.gov/nchs/w2w/new_jersey.htm' },
    ],
    chain: [
      { k: 's8.jd', l: 'Joseph Diglio — death certificate, Dec 1938, NJ' },
      { k: 's8.jm', l: 'Joseph Diglio & Louise Averso — marriage, April 1923, NJ' },
      { k: 's8.pb', l: 'Palma Louise Diglio — birth certificate, 1936, NJ' },
      { k: 's8.pm', l: 'Palma — marriage certificate' },
      { k: 's8.ab', l: 'Applicant — birth certificate, 1971' },
      { k: 's8.am', l: 'Applicant — marriage certificate, if applicable' },
    ],
    chainStages: [
      { s: 'ord', l: 'Ordered' },
      { s: 'apo', l: 'Apostilled' },
      { s: 'tra', l: 'Translated' },
    ],
    items: [],
  },
  {
    id: 's9',
    num: '09',
    title: 'Settle the comune, request the atto di nascita',
    tag: 'Cost of a stamp',
    lede: 'You cannot write to the right town until you resolve Atripalda versus Santa Paolina.',
    blocks: [
      { t: 'h', v: 'Evidence in hand' },
      { t: 'list', v: [
        'The tree says Atripalda for Joseph',
        'Earlier working assumption was Santa Paolina',
        'Santa Paolina is where the Stanziale line, his mother’s family, comes from',
        'Gaetano Averso, your other great-grandfather, was born in Atripalda in 1878',
      ] },
      { t: 'note', v: 'That last point is a real thumb on the scale. Two Italian families marrying in Newark usually came from the same paesano network.' },
      { t: 'warn', v: 'Rule: get two independent sources agreeing before you write. If they split, write to both. A letter costs a stamp and the Italian draft is already written.' },
      { t: 'h', v: 'What you are requesting' },
      { t: 'p', v: 'Estratto dell’atto di nascita for Giuseppe Diglio, born [year], son of Michele Diglio and Serafina Stanziale.' },
    ],
    links: [],
    items: [
      { k: 's9.src1900', l: '1900 census — birthplace column', h: 'Usually says only "Italy".' },
      { k: 's9.src1923', l: '1923 marriage record — often names the town' },
      { k: 's9.src1938', l: '1938 death certificate — often names the town, informant-supplied' },
      { k: 's9.srcwwi', l: 'WWI draft card — asks place of birth' },
      { k: 's9.decide', l: 'Two independent sources agree — comune settled' },
      { k: 's9.write', l: 'Request sent to the comune' },
      { k: 's9.received', l: 'Estratto dell’atto di nascita received' },
    ],
    facts: ['comune'],
  },
  {
    id: 's10',
    num: '10',
    title: 'File with the consulate',
    tag: 'Miami jurisdiction',
    lede: 'Applications go to Miami only if you legally and permanently reside in the listed states.',
    blocks: [
      { t: 'p', v: 'Florida, Georgia, South Carolina, Alabama, Mississippi, Puerto Rico or the listed Caribbean territories. Murrells Inlet qualifies.' },
      { t: 'p', v: 'Appointments run through Prenot@mi. Register early — wait times are long, and the current Miami queue has not been verified.' },
      { t: 'note', v: 'The alternative: apply at a comune in Italy after establishing residency there. Faster in practice, but requires actually living there for several months.' },
      { t: 'warn', v: 'The consulate does not accept a self-declaration that an ancestor held no other citizenship. It has to be documented.' },
    ],
    links: [
      { l: 'Consulate of Miami — citizenship by descent', u: 'https://consmiami.esteri.it/en/servizi-consolari-e-visti/foreign-citizen-services/1470-2/italian-citizenship-by-descent-jure-sanguinis/' },
    ],
    items: [
      { k: 's10.attorney', l: 'Attorney consultation — confirm this is not a 1948 case', h: 'Open question 1. Do this before spending anything on a judicial route.' },
      { k: 's10.prenotami', l: 'Register on Prenot@mi' },
      { k: 's10.queue', l: 'Check current Miami wait time' },
      { k: 's10.book', l: 'Appointment booked' },
      { k: 's10.file', l: 'Application filed' },
    ],
  },
];

/* Uncertainties the source document flagged. Shown as-is, unverified. */
const OPEN_QUESTIONS = [
  {
    t: 'The "1948 case" framing is probably wrong',
    v: 'Joseph was male and transmitted to Palma in 1936, which fathers could always do. Palma transmitted in 1971, after January 1, 1948, which mothers could do. There is no pre-1948 female link in this chain. That framing likely carried over from the earlier Gaetano Averso theory, which would genuinely have been a 1948 case. If this holds, no Italian court is needed at all — confirm with an attorney before spending on the judicial track.',
    weight: 'high',
  },
  {
    t: 'Article 3-bis(1)(c) runs two tests off two different dates',
    v: 'The chain requires Joseph to have been Italian in 1936, when Palma was born. The letter (c) exception requires him to have been exclusively Italian at death in December 1938. If he naturalized in the narrow gap between those dates, the chain holds but the exception fails. No ruling or circular addressing that precise fact pattern has been seen. Practically the risk is low — he was still an alien at 35 after 31 years here.',
    weight: 'med',
  },
  {
    t: 'USCIS fee amounts and the NARA transfer',
    v: 'Verify current fees on the USCIS page. The August 2026 proposed rule may reroute part of this to NARA.',
    weight: 'med',
  },
  {
    t: 'Miami consular wait times',
    v: 'Not verified. Check Prenot@mi directly.',
    weight: 'low',
  },
  {
    t: 'None of this is legal advice',
    v: 'The source document was not written by a lawyer. Given that this may be a straightforward administrative filing rather than a court case, a paid consultation with an Italian citizenship attorney is worth it specifically to confirm the first item above before spending anything on the judicial route.',
    weight: 'high',
  },
];

const BUDGET = [
  { l: 'FamilySearch searches', v: 'Free' },
  { l: 'Ancestry, if not already subscribed', v: '$25–40/mo' },
  { l: 'USCIS G-1041A, if a file exists', v: '$65–80' },
  { l: 'NARA certifications, 3 additional', v: '$50–150' },
  { l: 'NJ State Archives, 8 five-year searches', v: '$80' },
  { l: 'NJ certified vital records, ~6', v: '~$150' },
  { l: 'Apostilles, ~6', v: 'Varies' },
  { l: 'Italian translations, ~6 documents', v: '$300–600' },
  { l: 'Italian citizenship attorney consultation', v: '$200–500' },
];

const STATUSES = {
  open:     { code: '—',   l: 'Open',        d: 'Not started' },
  filed:    { code: 'REQ', l: 'Requested',   d: 'Submitted, waiting on a response' },
  found:    { code: 'REC', l: 'Record found', d: 'Searched, a record exists' },
  norecord: { code: 'NIL', l: 'No record',   d: 'Searched, nothing found — this is evidence' },
  na:       { code: 'N/A', l: 'Not applicable', d: 'Ruled out or superseded' },
};
const STATUS_ORDER = ['open', 'filed', 'found', 'norecord', 'na'];
