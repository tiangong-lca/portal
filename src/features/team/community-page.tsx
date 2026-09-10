"use client";

import Image from "next/image";
import { ChevronDownIcon, MailIcon } from "lucide-react";
import { type ReactNode, useId, useState } from "react";

import type { PortalLocale } from "@/i18n/routing";

import { contributors, domainExperts, partnerInstitutions } from "./community-data";
import "../../components/shell/site-shell.css";
import "./team-page.css";

type CommunityLabels = (typeof import("@/i18n/messages/en.json"))["Community"];

function localizedValue(locale: PortalLocale, zh: string, other: string) {
  return locale === "zh-CN" ? zh || other : other || zh;
}

function DirectoryDisclosure({
  children,
  closeLabel,
  label,
}: {
  children: ReactNode;
  closeLabel: string;
  label: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const contentId = useId();

  return (
    <div className="community-disclosure">
      {expanded ? (
        <div className="community-disclosure-content" id={contentId}>
          {children}
        </div>
      ) : null}
      <button
        aria-controls={contentId}
        aria-expanded={expanded}
        onClick={() => setExpanded((current) => !current)}
        type="button"
      >
        <span>{expanded ? closeLabel : label}</span>
        <ChevronDownIcon aria-hidden="true" />
      </button>
    </div>
  );
}

function ExpertList({
  experts,
  labels,
  locale,
}: {
  experts: readonly (typeof domainExperts)[number][];
  labels: CommunityLabels;
  locale: PortalLocale;
}) {
  return (
    <ul className="community-expert-grid">
      {experts.map((expert) => (
        <li className="community-expert-card" id={expert.slug} key={expert.slug}>
          <div className="community-expert-portrait">
            <Image
              alt=""
              aria-hidden="true"
              height={480}
              sizes="(max-width: 580px) 88px, 112px"
              src={expert.image}
              width={480}
            />
          </div>
          <div className="community-expert-copy">
            <div className="community-person-heading">
              <h3>{expert.name}</h3>
              {expert.email ? (
                <a
                  aria-label={labels.emailMember.replace("{name}", expert.name)}
                  className="community-email"
                  href={`mailto:${expert.email}`}
                >
                  <MailIcon aria-hidden="true" />
                </a>
              ) : null}
            </div>
            <p>{localizedValue(locale, expert.affiliationZh, expert.affiliationEn)}</p>
            {expert.domainZh || expert.domainEn ? (
              <span>{localizedValue(locale, expert.domainZh, expert.domainEn)}</span>
            ) : null}
          </div>
        </li>
      ))}
    </ul>
  );
}

function ContributorList({
  entries,
  locale,
}: {
  entries: readonly (typeof contributors)[number][];
  locale: PortalLocale;
}) {
  return (
    <ul className="community-contributor-grid">
      {entries.map((contributor) => (
        <li key={contributor.slug}>
          <h3>{localizedValue(locale, contributor.nameZh, contributor.nameEn)}</h3>
          <p>{contributor.affiliation}</p>
          {contributor.topicZh || contributor.topicEn ? (
            <span>{localizedValue(locale, contributor.topicZh, contributor.topicEn)}</span>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

function PartnerList({
  entries,
  locale,
}: {
  entries: readonly (typeof partnerInstitutions)[number][];
  locale: PortalLocale;
}) {
  return (
    <ul className="community-partner-grid">
      {entries.map((partner) => (
        <li key={partner.nameZh}>
          <div className="community-partner-mark">
            <Image
              alt=""
              aria-hidden="true"
              height={220}
              sizes="(max-width: 580px) 42vw, (max-width: 1080px) 22vw, 160px"
              src={partner.logo}
              width={480}
            />
          </div>
          <p>{localizedValue(locale, partner.nameZh, partner.nameEn)}</p>
        </li>
      ))}
    </ul>
  );
}

/** @import import { CommunityPageView } from "@/features/team/community-page"; */
export function CommunityPageView({
  labels,
  locale,
}: {
  labels: CommunityLabels;
  locale: PortalLocale;
}) {
  const visibleExperts = domainExperts.slice(0, 12);
  const remainingExperts = domainExperts.slice(12);
  const visiblePartners = partnerInstitutions.slice(0, 18);
  const remainingPartners = partnerInstitutions.slice(18);
  const visibleContributors = contributors.slice(0, 18);
  const remainingContributors = contributors.slice(18);

  return (
    <main id="main-content" className="team-page community-page">
      <section className="community-hero site-shell-container" aria-labelledby="community-title">
        <div className="team-hero-grid" aria-hidden="true" />
        <p className="team-kicker">{labels.kicker}</p>
        <div className="community-hero-copy">
          <h1 id="community-title">{labels.title}</h1>
          <p>{labels.description}</p>
        </div>
      </section>

      <div className="team-community site-shell-container">
        <section aria-labelledby="domain-experts-title" className="community-group">
          <div className="community-group-heading">
            <h2 id="domain-experts-title">{labels.domainExperts}</h2>
            <p>{labels.domainExpertsDescription}</p>
          </div>
          <ExpertList experts={visibleExperts} labels={labels} locale={locale} />
          <DirectoryDisclosure
            closeLabel={labels.hideExperts}
            label={labels.showAllExperts.replace("{count}", String(remainingExperts.length))}
          >
            <ExpertList experts={remainingExperts} labels={labels} locale={locale} />
          </DirectoryDisclosure>
        </section>

        <section aria-labelledby="partners-title" className="community-group community-partners">
          <div className="community-group-heading">
            <h2 id="partners-title">{labels.partners}</h2>
            <p>{labels.partnersDescription}</p>
          </div>
          <PartnerList entries={visiblePartners} locale={locale} />
          <DirectoryDisclosure
            closeLabel={labels.hidePartners}
            label={labels.showAllPartners.replace("{count}", String(remainingPartners.length))}
          >
            <PartnerList entries={remainingPartners} locale={locale} />
          </DirectoryDisclosure>
        </section>

        <section aria-labelledby="contributors-title" className="community-group">
          <div className="community-group-heading">
            <h2 id="contributors-title">{labels.contributors}</h2>
            <p>{labels.contributorsDescription}</p>
          </div>
          <ContributorList entries={visibleContributors} locale={locale} />
          <DirectoryDisclosure
            closeLabel={labels.hideContributors}
            label={labels.showAllContributors.replace(
              "{count}",
              String(remainingContributors.length),
            )}
          >
            <ContributorList entries={remainingContributors} locale={locale} />
          </DirectoryDisclosure>
        </section>
      </div>
    </main>
  );
}
