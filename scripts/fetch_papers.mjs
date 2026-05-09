#!/usr/bin/env node

import { writeFileSync, readFileSync, existsSync } from "node:fs";
import { parseArgs } from "node:util";

const PUBMED_SEARCH = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi";
const PUBMED_FETCH = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi";

const SEARCH_QUERIES = [
  {
    name: "LSD Addiction Broad",
    query: (days) => {
      const lookback = getDate(days);
      return `(("Lysergic Acid Diethylamide"[Mesh] OR LSD[tiab] OR "lysergic acid diethylamide"[tiab]) AND ("Substance-Related Disorders"[Mesh] OR addiction[tiab] OR dependence[tiab] OR "hallucinogen use disorder"[tiab] OR "substance use disorder"[tiab] OR "abuse liability"[tiab] OR "dependence liability"[tiab] OR misuse[tiab] OR abuse[tiab])) AND "${lookback}"[Date - Publication] : "3000"[Date - Publication]`;
    },
  },
  {
    name: "LSD Hallucinogen Use Disorder",
    query: (days) => {
      const lookback = getDate(days);
      return `((LSD[tiab] OR "lysergic acid diethylamide"[tiab] OR hallucinogen*[tiab] OR psychedelic*[tiab]) AND ("hallucinogen use disorder"[tiab] OR "psychedelic use disorder"[tiab] OR "substance use disorder"[tiab] OR "Substance-Related Disorders"[Mesh])) AND "${lookback}"[Date - Publication] : "3000"[Date - Publication]`;
    },
  },
  {
    name: "LSD Dependence Liability",
    query: (days) => {
      const lookback = getDate(days);
      return `(("Lysergic Acid Diethylamide"[Mesh] OR LSD[tiab] OR "lysergic acid diethylamide"[tiab]) AND ("abuse liability"[tiab] OR "dependence liability"[tiab] OR reinforcement[tiab] OR "drug seeking"[tiab] OR craving[tiab] OR self-administration[tiab] OR tolerance[tiab] OR withdrawal[tiab])) AND "${lookback}"[Date - Publication] : "3000"[Date - Publication]`;
    },
  },
  {
    name: "LSD HPPD Flashbacks",
    query: (days) => {
      const lookback = getDate(days);
      return `((LSD[tiab] OR "lysergic acid diethylamide"[tiab] OR hallucinogen*[tiab] OR psychedelic*[tiab]) AND ("hallucinogen persisting perception disorder"[tiab] OR HPPD[tiab] OR flashback*[tiab] OR "perceptual disturbance*"[tiab] OR "visual snow"[tiab])) AND "${lookback}"[Date - Publication] : "3000"[Date - Publication]`;
    },
  },
  {
    name: "LSD Toxicology Emergency",
    query: (days) => {
      const lookback = getDate(days);
      return `(("Lysergic Acid Diethylamide"[Mesh] OR LSD[tiab] OR "lysergic acid diethylamide"[tiab]) AND (intoxication[tiab] OR toxicity[tiab] OR poisoning[tiab] OR overdose[tiab] OR "emergency department"[tiab] OR "poison center"[tiab] OR agitation[tiab] OR delirium[tiab])) AND "${lookback}"[Date - Publication] : "3000"[Date - Publication]`;
    },
  },
  {
    name: "LSD Polysubstance Use",
    query: (days) => {
      const lookback = getDate(days);
      return `((LSD[tiab] OR "lysergic acid diethylamide"[tiab] OR hallucinogen*[tiab] OR psychedelic*[tiab]) AND (polysubstance[tiab] OR "poly-substance"[tiab] OR co-use[tiab] OR coingestion[tiab] OR cannabis[tiab] OR alcohol[tiab] OR MDMA[tiab] OR amphetamine[tiab] OR methamphetamine[tiab] OR cocaine[tiab] OR opioid*[tiab] OR benzodiazepine*[tiab])) AND "${lookback}"[Date - Publication] : "3000"[Date - Publication]`;
    },
  },
  {
    name: "LSD Psychiatric Adverse Effects",
    query: (days) => {
      const lookback = getDate(days);
      return `(("Lysergic Acid Diethylamide"[Mesh] OR LSD[tiab] OR "lysergic acid diethylamide"[tiab]) AND (psychosis[tiab] OR "substance-induced psychosis"[tiab] OR mania[tiab] OR panic[tiab] OR anxiety[tiab] OR suicidality[tiab] OR "adverse event*"[tiab] OR "adverse effect*"[tiab])) AND "${lookback}"[Date - Publication] : "3000"[Date - Publication]`;
    },
  },
  {
    name: "LSD Neurobiology Addiction",
    query: (days) => {
      const lookback = getDate(days);
      return `(("Lysergic Acid Diethylamide"[Mesh] OR LSD[tiab] OR "lysergic acid diethylamide"[tiab] OR "classic psychedelic*"[tiab]) AND (addiction[tiab] OR "substance use disorder"[tiab] OR craving[tiab] OR reinforcement[tiab] OR "drug seeking"[tiab]) AND ("5-HT2A"[tiab] OR serotonin[tiab] OR dopamine[tiab] OR glutamate[tiab] OR "reward circuitry"[tiab] OR neuroplasticity[tiab] OR "functional connectivity"[tiab])) AND "${lookback}"[Date - Publication] : "3000"[Date - Publication]`;
    },
  },
  {
    name: "Psychedelic Therapy SUD",
    query: (days) => {
      const lookback = getDate(days);
      return `((LSD[tiab] OR "lysergic acid diethylamide"[tiab] OR psilocybin[tiab] OR ayahuasca[tiab] OR "classic psychedelic*"[tiab] OR "serotonergic psychedelic*"[tiab]) AND ("substance use disorder"[tiab] OR addiction[tiab] OR alcoholism[tiab] OR "alcohol use disorder"[tiab] OR "tobacco use disorder"[tiab] OR "opioid use disorder"[tiab] OR "stimulant use disorder"[tiab]) AND (treatment[tiab] OR therapy[tiab] OR psychotherapy[tiab] OR trial[tiab])) AND "${lookback}"[Date - Publication] : "3000"[Date - Publication]`;
    },
  },
  {
    name: "LSD Harm Reduction Policy",
    query: (days) => {
      const lookback = getDate(days);
      return `((LSD[tiab] OR "lysergic acid diethylamide"[tiab] OR psychedelic*[tiab] OR hallucinogen*[tiab]) AND ("harm reduction"[tiab] OR "drug checking"[tiab] OR "set and setting"[tiab] OR festival*[tiab] OR rave*[tiab] OR nightlife[tiab] OR "drug policy"[tiab] OR decriminalization[tiab] OR criminalization[tiab])) AND "${lookback}"[Date - Publication] : "3000"[Date - Publication]`;
    },
  },
  {
    name: "LSD Young Adults Risk",
    query: (days) => {
      const lookback = getDate(days);
      return `((LSD[tiab] OR "lysergic acid diethylamide"[tiab] OR hallucinogen*[tiab] OR psychedelic*[tiab]) AND (adolescent*[tiab] OR youth[tiab] OR "young adult*"[tiab] OR "college student*"[tiab] OR student*[tiab]) AND (use[tiab] OR misuse[tiab] OR "risk behavior*"[tiab] OR "risk perception"[tiab] OR "substance use disorder"[tiab])) AND "${lookback}"[Date - Publication] : "3000"[Date - Publication]`;
    },
  },
];

function getDate(daysAgo) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}/${m}/${day}`;
}

function getTaipeiDate() {
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  const taipei = new Date(utc + 8 * 3600000);
  const y = taipei.getFullYear();
  const m = String(taipei.getMonth() + 1).padStart(2, "0");
  const d = String(taipei.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

async function searchPapers(query, retmax = 20) {
  const url = `${PUBMED_SEARCH}?db=pubmed&term=${encodeURIComponent(query)}&retmax=${retmax}&sort=date&retmode=json`;
  const resp = await fetch(url, {
    headers: { "User-Agent": "LSDAddictionBot/1.0 (research aggregator)" },
    signal: AbortSignal.timeout(30000),
  });
  if (!resp.ok) throw new Error(`PubMed search HTTP ${resp.status}`);
  const data = await resp.json();
  return data?.esearchresult?.idlist || [];
}

async function fetchDetails(pmids) {
  if (!pmids.length) return [];
  const ids = pmids.join(",");
  const url = `${PUBMED_FETCH}?db=pubmed&id=${ids}&retmode=xml`;
  const resp = await fetch(url, {
    headers: { "User-Agent": "LSDAddictionBot/1.0 (research aggregator)" },
    signal: AbortSignal.timeout(60000),
  });
  if (!resp.ok) throw new Error(`PubMed fetch HTTP ${resp.status}`);
  const xml = await resp.text();

  const papers = [];
  const articleRegex = /<PubmedArticle>([\s\S]*?)<\/PubmedArticle>/g;
  let match;
  while ((match = articleRegex.exec(xml)) !== null) {
    const block = match[1];
    const titleMatch = block.match(/<ArticleTitle>([\s\S]*?)<\/ArticleTitle>/);
    let title = titleMatch ? titleMatch[1].replace(/<[^>]+>/g, "").trim() : "";

    const abstractParts = [];
    const absRegex = /<AbstractText[^>]*>([\s\S]*?)<\/AbstractText>/g;
    let absMatch;
    while ((absMatch = absRegex.exec(block)) !== null) {
      const labelMatch = absMatch[0].match(/Label="([^"]+)"/);
      const label = labelMatch ? labelMatch[1] : "";
      const text = absMatch[1].replace(/<[^>]+>/g, "").trim();
      if (label && text) abstractParts.push(`${label}: ${text}`);
      else if (text) abstractParts.push(text);
    }
    const abstract = abstractParts.join(" ").slice(0, 2000);

    const journalMatch = block.match(/<Title>([\s\S]*?)<\/Title>/);
    const journal = journalMatch ? journalMatch[1].trim() : "";

    const yearMatch = block.match(/<Year>(\d{4})<\/Year>/);
    const monthMatch = block.match(/<Month>([^<]+)<\/Month>/);
    const dayMatch = block.match(/<Day>(\d+)<\/Day>/);
    const dateStr = [yearMatch?.[1], monthMatch?.[1], dayMatch?.[1]].filter(Boolean).join(" ");

    const pmidMatch = block.match(/<PMID[^>]*>(\d+)<\/PMID>/);
    const pmid = pmidMatch ? pmidMatch[1] : "";
    const link = pmid ? `https://pubmed.ncbi.nlm.nih.gov/${pmid}/` : "";

    const keywords = [];
    const kwRegex = /<Keyword>([^<]+)<\/Keyword>/g;
    let kwMatch;
    while ((kwMatch = kwRegex.exec(block)) !== null) {
      keywords.push(kwMatch[1].trim());
    }

    if (title) {
      papers.push({ pmid, title, journal, date: dateStr, abstract, url: link, keywords });
    }
  }
  return papers;
}

function loadSummarizedPmids() {
  const path = "docs/summarized_pmids.json";
  if (existsSync(path)) {
    try {
      const data = JSON.parse(readFileSync(path, "utf-8"));
      return new Set(data.pmids || []);
    } catch {
      return new Set();
    }
  }
  return new Set();
}

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = { days: 7, maxPapers: 40, output: "papers.json" };
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--days" && args[i + 1]) opts.days = parseInt(args[++i], 10);
    else if (args[i] === "--max-papers" && args[i + 1]) opts.maxPapers = parseInt(args[++i], 10);
    else if (args[i] === "--output" && args[i + 1]) opts.output = args[++i];
  }
  return opts;
}

async function main() {
  const opts = parseArgs();
  const dateStr = getTaipeiDate();
  const summarized = loadSummarizedPmids();

  console.error(`[INFO] Searching PubMed for LSD addiction papers from last ${opts.days} days...`);

  const allPmids = new Set();
  for (const sq of SEARCH_QUERIES) {
    try {
      const query = sq.query(opts.days);
      const pmids = await searchPapers(query, 20);
      for (const id of pmids) allPmids.add(id);
      console.error(`[INFO] ${sq.name}: found ${pmids.length} PMIDs`);
    } catch (err) {
      console.error(`[WARN] ${sq.name} failed: ${err.message}`);
    }
  }

  const newPmids = [...allPmids].filter((id) => !summarized.has(id));
  console.error(`[INFO] Total unique PMIDs: ${allPmids.size}, new (not summarized): ${newPmids.length}`);

  const pmidsToFetch = newPmids.slice(0, opts.maxPapers);
  let papers = [];
  if (pmidsToFetch.length > 0) {
    try {
      papers = await fetchDetails(pmidsToFetch);
      console.error(`[INFO] Fetched details for ${papers.length} papers`);
    } catch (err) {
      console.error(`[ERROR] Fetch details failed: ${err.message}`);
    }
  }

  const output = {
    date: dateStr,
    count: papers.length,
    papers,
  };

  writeFileSync(opts.output, JSON.stringify(output, null, 2), "utf-8");
  console.error(`[INFO] Saved to ${opts.output}`);
}

main().catch((err) => {
  console.error(`[FATAL] ${err.message}`);
  process.exit(1);
});
